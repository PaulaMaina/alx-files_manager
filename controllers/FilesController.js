/* eslint-disable no-unused-vars */
import { contentType } from 'mime-types';
import dbClient from '../utils/db';
import { userFromXToken } from '../utils/auth';
import { join as joinDirPath } from 'path';
import { mkdir, writeFile, stat, existsSync, realpath } from 'fs';
import mongoDBCore from 'mongodb/lib/core';
import { promisify } from 'util';
import Queue from 'bull/lib/queue';
import { Request, Response } from 'express';
import { tmpdir } from 'os';
import { v4 as uuidv4 } from 'uuid';

const validFileTypes = {
  folder: 'folder',
  file: 'file',
  image: 'image',
};

const defaultRootFolder = 'files_manager';
const rootFolderID = 0;
const mkdirAsync = promisify(mkdir);
const writefileAsync  = promisify(writeFile);
const statAsync = promisify(stat);
const realpathAsync = promisify(realpath);
const fileQueue = new Queue('thumbnail generation');
const nullID = Buffer.alloc(24, '0').toString('utf-8');
const isIdValid = (id) => {
  const size = 24;
  let x = 0;
  const characterRanges = [
    [48, 57],
    [97, 102],
    [65, 70],
  ];
  if (typeof id !== 'string' || id.length !== size) {
    return false;
  }
  while (x < size) {
    const c = id[x];
    const code = c.charCodeAt(0);

    if (!characterRanges.some((range) => code >= range[0] && code <= range[1])) {
      return false;
    }
    x += 1;
  }
  return true;
};

class FilesController {
  static async postUpload(request, response) {
    const { user } = request;
    const name = request.body ? request.body.name : null;
    const type = request.body ? request.body.type : null;
    const parentId = request.body && request.body.parentId ? request.body.parentId : rootFolderID;
    const isPublic = request.body && request.body.isPublic ? request.body.isPublic : false;
    const base64Data = request.body && request.body.data ? request.body.data : '';

    if (!name) {
      response.status(400).json({ error: 'Missing name' });
      return;
    }

    if (!type || !Object.values(validFileTypes).includes(type)) {
      response.status(400).json({ error: 'Missing type' });
      return;
    }

    if (!request.body.data && type !== validFileTypes.folder) {
      response.status(400).json({ error: 'Missing data' });
      return;
    }

    if ((parentId !== rootFolderID) && (parentId !== rootFolderID.toString())) {
      const file = await (await dbClient.filesCollection())
        .findOne({
          _id: new mongoDBCore.BSON.ObjectId(isIdValid(parentId) ? parentId : nullID),
	});

      if (!file) {
        response.status(400).json({ error: 'Parent not found' });
        return;
      }
      if (file.type !== validFileTypes.folder) {
        response.status(400).json({ error: 'Parent is not a folder' });
        return;
      }
    }
    const userId = user._id.toString();
    const parentDir = `${process.env.FOLDER_PATH || ''}`.trim().length > 0
      ? process.env.FOLDER_PATH.trim()
      : joinDirPath(tmpdir(), defaultRootFolder);
    const newFile = {
      userId: new mongoDBCore.BSON.ObjectId(userId),
      name,
      type,
      isPublic,
      parentId: (parentId === rootFolderID) || (parentId === rootFolderID.toString())
        ? '0'
        : new mongoDBCore.BSON.ObjectId(parentId),
    };
    await mkdirAsync(parentDir, { recursive: true });
    if (type !== validFileTypes.folder) {
      const localPath = joinDirPath(parentDir, uuidv4());
      await writefileAsync(localPath, Buffer.from(base64Data, 'base64'));
      newFile.localPath = localPath;
    }
    const addNewFile = await (await dbClient.filesCollection())
      .insertOne(newFile);
    const fileId = addNewFile.insertedId.toString();

    if (type === validFileTypes.image) {
      const job = `Image thumbnail [${userId}-${fileId}]`;
	
      fileQueue.add({ userId, fileId, name: job });
    }
    response.status(201).json({
      id: fileId,
      userId,
      name,
      type,
      isPublic,
      parentId: (parentId === rootFolderID) || (parentId === rootFolderID.toString())
        ? 0
        : parentId,
    });
  }

  static async getShow(request, response) {
    const { user } = request;
    const id = request.params ? request.params.id : nullID;
    const userId = user._id.toString();
    const file = await (await dbClient.filesCollection()).findOne({
      _id: new mongoDBCore.BSON.ObjectId(isIdValid(id) ? id : nullID),
      userId: new mongoDBCore.BSON.ObjectId(isIdValid(userId) ? userId : nullID),
    });

    if (!file) {
      response.status(404).json({ error: 'Not found' });
      return;
    }
    response.status(200).json({ 
      id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: file.isPublic,
      parentId: file.parentId === rootFolderID.toString()
        ? 0
        : file.parentId.toString(),
    });
  }

  static async getIndex(request, response) {
    const { user } = request;
    const parentId = request.query.parentId || rootFolderID.toString();
    const page = /\d+/.test((request.query.page || '').toString())
      ? Number.parseInt(request.query.page, 10)
      : 0;
    const filterFiles = {
      userId: user._id,
      parentId: parentId === rootFolderID.toString()
        ? parentId
        : new mongoDBCore.BSON.ObjectId(isIdValid(parentId) ? parentId : nullID),
    };
    const files = await (await (await dbClient.filesCollection())
      .aggregate([
        { $match: filterFiles },
        { $sort: { _id: -1 } },
        { $skip: page * 20 },
        { $limit: 20 },
        {
          $project: {
            _id: 0,
            id: '$_id',
            userId: '$userId',
            name: '$name',
            type: '$type',
            isPublic: '$isPublic',
            parentId: {
              $cond: { if: { $eq: ['$parentId', '0'] }, then: 0, else: '$parentId' },
            },
          },
        },
      ])).toArray();
    response.status(200).json(files);
  }

  static async putPublish(request, response) {
    const { user } = request;
    const { id } = request.params;
    const userId = user._id.toString();
    const findFile = {
      _id: new mongoDBCore.BSON.ObjectId(isIdValid(id) ? id : nullID),
      userId: new mongoDBCore.BSON.ObjectId(isIdValid(userId) ? userId : nullID),
    };
    const file = await (await dbClient.filesCollection())
      .findOne(findFile);

    if (!file) {
      response.status(404).json({ error: 'Not found' });
      return;
    }
    await (await dbClient.filesCollection())
      .updateOne(findFile,  { $set: { isPublic: true } });
    response.status(200).json({
      id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId === rootFolderID.toString()
        ? 0
        : file.parentId.toString(),
    });
  }

  static async putUnpublish(request, response) {
    const { user } = request;
    const { id } = request.params;
    const userId = user._id.toString();
    const findFile = {
      _id: new mongoDBCore.BSON.ObjectId(isIdValid(id) ? id : nullID),
      userId: new mongoDBCore.BSON.ObjectId(isIdValid(userId) ? userId : nullID),
    };
    const file = await (await dbClient.filesCollection())
      .findOne(findFile);

    if (!file) {
      response.status(404).json({ error: 'Not found' });
      return;
    }
    await (await dbClient.filesCollection())
      .updateOne(findFile,  { $set: { isPublic: false } });
    response.status(200).json({
      id,
      userId,
      name: file.name,
      type: file.type,
      isPublic: true,
      parentId: file.parentId === rootFolderID.toString()
        ? 0
        : file.parentId.toString(),
    });
  }

  static async getFile(request, response) {
    const user = await userFromXToken(request);
    const { id } = request.params;
    const userId = user ? user._id.toString() : '';
    const size = request.query.size || null;
    const findFile = {
      _id: new mongoDBCore.BSON.ObjectId(isIdValid(id) ? id : nullID),
    };
    const file = await (await dbClient.filesCollection())
      .findOne(findFile);
    let filepath = file.localPath;
  
    if (!file || (!file.isPublic && (file.userId.toString() !== userId))) {
      response.status(404).json({ error: 'Not found' });
      return;
    }
    if (file.type === validFileTypes.folder) {
      response.status(400).json({ error: 'A folder doesn\'t have content' });
      return;
    }
    if (size) {
       filepath = `${file.localPath}_${size}`;
    }
    if (existsSync(filepath)) {
      const fileDetails = await statAsync(filepath);
      if (!fileDetails.isFile()) {
        response.status(404).json({ error: 'Not found' });
        return;
      } 
    } else {
      response.status(404).json({ error: 'Not found' });
      return;
    }
    const absFilePath = await realpathAsync(filepath);
    response.setHeader('Content-Type', contentType(file.name) || 'text/plain; charset=utf-8');
    response.status(200).sendFile(absFilePath);
  }
}

export default FilesController;
