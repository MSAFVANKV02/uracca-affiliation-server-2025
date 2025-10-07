import mongoose from "mongoose";
import chalk from "chalk";

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URL);
    console.log(chalk.blue("MongoDb connected successfully 👍"));
  } catch (error) {
    console.error(`Can't connect! ${error}`);
  }
};

export default connectDB;
