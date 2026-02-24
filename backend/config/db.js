const mongoose = require('mongoose');

const connectDB = async () => {
  const envUri = process.env.MONGODB_URI;
  const defaultLocal = 'mongodb://127.0.0.1:27017/velomynt_hrms';
  const uri = envUri || defaultLocal;

  try {
    const conn = await mongoose.connect(uri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return;
  } catch (error) {
    console.error(`MongoDB connection error using URI: ${uri}`);
    console.error(error.message);

    // If the configured URI used SRV (mongodb+srv) and DNS/SRV lookup failed,
    // try a local fallback to help development machines without SRV/DNS access.
    if (envUri && envUri.startsWith('mongodb+srv://') && uri !== defaultLocal) {
      console.warn('Detected mongodb+srv URI and SRV lookup failed. Trying local fallback...');
      try {
        const fallbackConn = await mongoose.connect(defaultLocal, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected (fallback): ${fallbackConn.connection.host}`);
        return;
      } catch (fbErr) {
        console.error('Fallback connection failed:', fbErr.message);
      }
    }

    console.error('Unable to connect to MongoDB. Please check your MONGODB_URI, network/DNS, or run a local MongoDB instance.');
    process.exit(1);
  }
};

module.exports = connectDB;

