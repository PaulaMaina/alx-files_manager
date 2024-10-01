#!/usr/bin/yarn dev
import mongodb from 'mongodb';
// eslint-disable-next-line no-unused-vars
import Collection from 'mongodb/lib/collection';
import dbEnvVariables from './env_db';

class DBClient {
  constructor() {
    dbEnvVariables();
    const host = process.env.DB_HOST || 'localhost';
    const port = process.env.DB_PORT || 27017;
    const database = process.env.DB_DATABASE || 'files_manager';
    const databaseURL = `mongodb://${host}:${port}/${database}`;

    this.client = new mongodb.MongoClient(databaseURL, { useUnifiedTopology: true }, { connectTimeoutMS: 30000 }, { keepAlive: 1 });
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

  async usersCollection() {
    return this.client.db().collection('users');
  }

  async filesCollectioni() {
    return this.client.db().collection('files');
  }
}

const dbClient = new DBClient();
export default dbClient;
