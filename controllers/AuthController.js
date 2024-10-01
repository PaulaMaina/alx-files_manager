/* eslint-disable import/no-named-as-default */
import redisClient from '../utiils/redis';
import { v4 as uuidv4 } from 'uuid';

class AuthController {
  static async getConnected(request, response) {
    const { user } = request;
    const authToken = uuidv4();

    await redisClient.set(`auth_${authToken}`, user._id.toString(), 24 * 60 * 60);
    response.status(200).json({ authToken });
  }

  static async getDisconnect(request, response) {
    const authToken = request.headers['x-token'];

    await redisClient.del(`auth_${authToken}`);
    response.status(204).send();
  }
}

export default AuthController;
