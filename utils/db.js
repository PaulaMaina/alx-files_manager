#!/usr/bin/yarn dev

// eslint-disable-next-line no-unused-vars
import Collection from 'mongodb/lib/collection';
import dbEnvVariables from './env_db';
import mongodb from 'mongodb';

class DBClient {
  constructor() {
    dbEnvVariables();
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const databaseURL = `mongodb://${host}:${port}/${database}`;

    this.client = new mongodb.MongoClient(databaseURL, { useUnifiedTopology: true });
    this.client.connect();
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    return this.client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    return this.client.db().collection('files').countDocuments();
  }

  async userCollection() {
    return this.client.db().collection('users');
  }

  async filesCollection() {
    return this.client.db().collection('files');
  }
}

const dbClient = new DBClient();
export default dbClient;
