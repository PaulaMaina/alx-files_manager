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

    this.client = new mongodb.MongoClient(databaseURL, { useUnifiedTopology: true });
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('Connected to MongoDB');
    } catch (err) {
      console.error('Failed to connect to MongoDB:', err);
    }
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    await this.connect();
    return this.client.db().collection('users').countDocuments();
  }

  async nbFiles() {
    await this.connect();
    return this.client.db().collection('files').countDocuments();
  }

  async usersCollection() {
    await this.connect();
    return this.client.db().collection('users');
  }

  async filesCollectioni() {
    await this.connect();
    return this.client.db().collection('files');
  }
}

const dbClient = new DBClient();
export default dbClient;
