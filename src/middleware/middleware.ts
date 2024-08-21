import * as jwt from 'jsonwebtoken';
import multer from '@koa/multer';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { Storage } from '@google-cloud/storage';
import * as fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'SAI_RAM';

export const authenticate = async (ctx: any, next: any) => {
  const token = ctx.headers.authorization?.split(' ')[1];

  if (!token) {
    ctx.body = 'Authentication token is required';
    ctx.status = 401;
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    ctx.state.userPayload = decoded.userPayload;
    await next();
  } catch (err) {
    ctx.body = 'Invalid or expired token';
    ctx.status = 401;
  }
};

const deleteLocalFile = (localFilePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(localFilePath, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

export const uploadMiddleware = async (ctx: any, next: any) => {
  const newFileName = uuidv4();
  const originalname = ctx.request.params.extension;
  const upload = multer({
    dest: 'uploads/',
    limits: {
      fileSize: 5 * 1024 * 1024 * 1024,
    },
    storage: multer.diskStorage({
      destination: (req, file, cb) => cb(null, 'uploads/'),
      filename: (req, file, cb) =>
        cb(null, `${newFileName}${path.extname(file.originalname)}`),
    }),
  });

  await upload.single('file')(ctx, next);

  try {
    const response = await moveFileToGCS(newFileName, originalname);

    await deleteLocalFile(`./uploads/${newFileName}.${originalname}`);

    ctx.body = {
      message: 'File uploaded successfully to GCS',
      publicUrl: response?.publicUrl,
    };
    console.log(`File uploaded succesfully`);
  } catch (error) {
    console.error('Error moving file to GCS:', error);
    await deleteLocalFile(`./uploads/${newFileName}.${originalname}`);
    ctx.status = 500;
    ctx.body = { message: 'Error uploading file, please try again' };
  }
};

const moveFileToGCS = async (newName: string, originalname: string) => {
  try {
    console.log('process.env.GCP_PROJECT_ID', process.env.GCP_PROJECT_ID);
    console.log(
      'process.env.GCP_CREDENTIALS_PATH',
      process.env.GCP_CREDENTIALS_PATH
    );

    const storage = new Storage({
      projectId: process.env.GCP_PROJECT_ID,
      keyFilename: process.env.GCP_CREDENTIALS_PATH,
    });

    const filePath = `./uploads/${newName}.${originalname}`;

    let bucketName =
      process.env.GCP_BUCKET_NAME_PREFIX ??
      'GCP_NETWORK_SERVICE_BUCKET_BACKEND_NODEJS';

    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const localFileStream = require('fs').createReadStream(filePath);

    bucketName = bucketName.toLowerCase();

    await checkAndCreateBucket(bucketName, storage);

    const bucket = storage.bucket(bucketName);

    const gcsFilename = `${uuidv4()}.${originalname}`;

    const gcsFile = bucket.file(gcsFilename);

    const gcsWriteStream = gcsFile.createWriteStream({
      metadata: {
        contentDisposition: 'inline',
      },
    });

    localFileStream.pipe(gcsWriteStream);

    await new Promise((resolve, reject) => {
      gcsWriteStream.on('error', reject);
      gcsWriteStream.on('finish', resolve);
    });

    const publicUrl = `https://storage.googleapis.com/${bucketName}/${gcsFilename}`;
    return { publicUrl };
  } catch (err) {
    console.log(err);
    return { publicUrl: '' };
  }
};

async function checkAndCreateBucket(bucketName: string, storage: any) {
  try {
    const [exists] = await storage.bucket(bucketName).exists();
    if (!exists) {
      console.log(`Bucket ${bucketName} does not exist. Creating...`);
      await storage.createBucket(bucketName);
      console.log(`Bucket ${bucketName} created successfully.`);
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
    }
  } catch (error) {
    console.error('Error checking or creating bucket:', error);
  }
}
