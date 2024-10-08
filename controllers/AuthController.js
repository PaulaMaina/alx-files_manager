import redisClient from '../utils/redis';
import { v4 as uuidv4 } from 'uuid';

class AuthController {
  static async getConnect(request, response) {
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
