const mongoose = require('mongoose');
const dns = require('dns');

const isSrvDnsError = (error) => {
  const message = String(error?.message || '');
  return (
    message.includes('querySrv') ||
    message.includes('ENOTFOUND') ||
    message.includes('ECONNREFUSED')
  );
};

const applyCustomDnsServers = () => {
  const configured = process.env.MONGODB_DNS_SERVERS;
  if (!configured) return false;

  const servers = configured
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

  if (!servers.length) return false;
  dns.setServers(servers);
  console.log(`Using custom DNS servers for MongoDB: ${servers.join(', ')}`);
  return true;
};

const connectDB = async () => {
  const envUri = process.env.MONGODB_URI;
  const directUri = process.env.MONGODB_URI_DIRECT;
  const defaultLocal = 'mongodb://127.0.0.1:27017/velomynt_hrms';
  const uri = envUri || defaultLocal;

  applyCustomDnsServers();

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

    // If the configured URI used SRV and DNS lookup failed, retry with public DNS.
    if (envUri && envUri.startsWith('mongodb+srv://') && isSrvDnsError(error)) {
      console.warn('Detected mongodb+srv DNS issue. Retrying with public DNS resolvers...');
      try {
        dns.setServers(['8.8.8.8', '1.1.1.1']);
        const dnsRetryConn = await mongoose.connect(envUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected (DNS retry): ${dnsRetryConn.connection.host}`);
        return;
      } catch (dnsRetryErr) {
        console.error('DNS retry failed:', dnsRetryErr.message);
      }
    }

    // If direct Mongo URI is configured, prefer it as secondary fallback.
    if (directUri && directUri !== uri) {
      console.warn('Trying fallback MongoDB direct URI (MONGODB_URI_DIRECT)...');
      try {
        const directConn = await mongoose.connect(directUri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected (direct URI): ${directConn.connection.host}`);
        return;
      } catch (directErr) {
        console.error('Direct URI fallback failed:', directErr.message);
      }
    }

    // Last fallback for local development.
    if (uri !== defaultLocal) {
      console.warn('Trying local MongoDB fallback on 127.0.0.1:27017...');
      try {
        const localConn = await mongoose.connect(defaultLocal, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        });
        console.log(`MongoDB Connected (local fallback): ${localConn.connection.host}`);
        return;
      } catch (localErr) {
        console.error('Local fallback connection failed:', localErr.message);
      }
    }

    console.error('Unable to connect to MongoDB. Please check your MONGODB_URI, network/DNS, or run a local MongoDB instance.');
    process.exit(1);
  }
};

module.exports = connectDB;

