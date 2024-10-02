#!/usr/bin/yarn dev
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AppController {
  static getStatus(_request, response) {
    response.status(200).json({
      redis: redisClient.isAlive(),
      db: dbClient.isAlive()
    });
  }

  static getStats(request, response) {
    Promise.all([dbClient.nbUsers(), dbClient.nbFiles()])
      .then(([numOfUsers, numOfFiles]) => {
        response.status(200).json({ users: numOfUsers, files: numOfFiles });
      });
  }
}

export default AppController;
