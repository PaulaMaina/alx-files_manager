import dbClient from '../utils/db';
import Queue from 'bull/lib/queue';
import sha1 from 'sha1';

const userQueue = new Queue('email sending');

class UsersController {
  static async postNew(request, response) {
    const email = request.body ? request.body.email : null;
    const password = request.body ? request.body.password : null;

    if (!email) {
      response.status(400).json({ error: 'Missing email' });
      return;
    }
    if (!password) {
      response.status(400).json({ error: 'Missing password' });
      return;
    }

    const user = await (await dbClient.usersCollection()).findOne({ email });

    if (user) {
      response.status(400).json({ error: 'Already exist' });
      return;
    }
    const addNewUser = await (await dbClient.usersCollection())
      .insertOne({ email, password: sha1(password) });
    const userId = addNewUser.insertedId.toString();

    userQueue.add({ userId });
    response.status(201).json({ email, id: userId });
  }

  static async getMe(request, response) {
    const { user } = request;

    response.status(200).json({ email: user.email, id: user._id.toString() });
  }
}

export default UsersController;
