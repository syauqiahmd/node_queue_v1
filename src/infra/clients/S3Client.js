// The v2 SDK prints a maintenance-mode notice to stderr every time a process loads it, which
// shows up as error noise in the PM2 logs Grafana collects. Keep it quiet.
process.env.AWS_SDK_JS_SUPPRESS_MAINTENANCE_MODE_MESSAGE ??= '1';
const AWS = require('aws-sdk');

class S3Client {
  constructor({ logger }) {
    this.logger = logger;
    this.s3 = new AWS.S3({
      endpoint: process.env.S3_ENDPOINT,
      accessKeyId: process.env.S3_ACCESS_KEY_ID,
      secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
      region: process.env.S3_REGION, // e.g., 'us-east-1' or specific for your provider
      s3ForcePathStyle: true, // Required for some S3-compatible storage providers
    });
    this.bucketName = process.env.S3_BUCKET_NAME;
    // Base URL browsers use to fetch public objects (e.g. https://example.com/qms-media) when
    // S3_ENDPOINT is internal-only, such as a storage container behind a reverse proxy.
    this.publicBaseUrl = (process.env.S3_PUBLIC_URL || '').trim().replace(/\/+$/, '');
  }

  // URL returned to clients for an uploaded object: S3_PUBLIC_URL + key when set,
  // otherwise the location reported by the S3 endpoint.
  publicUrlFor(key, location) {
    if (!this.publicBaseUrl) {
      return location;
    }
    return `${this.publicBaseUrl}/${encodeURI(key.replace(/^\/+/, ''))}`;
  }

  async uploadFile(fileBuffer, fileName, contentType, expiresInSeconds = null) {
    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: fileBuffer,
      ContentType: contentType,
      ACL: 'public-read', // Adjust ACL as per your requirements
    };

    if (expiresInSeconds) {
      const expirationDate = new Date(Date.now() + expiresInSeconds * 1000);
      params.Expires = expirationDate;
      params.CacheControl = `max-age=${expiresInSeconds}`;
    }

    try {
      const data = await this.s3.upload(params).promise();
      const url = this.publicUrlFor(fileName, data.Location);
      this.logger.info(
        `File uploaded successfully to S3: ${url}${expiresInSeconds ? ` (expires in ${expiresInSeconds}s)` : ''}`
      );
      return url;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`);
      throw error;
    }
  }

  // Inverse of publicUrlFor: the object key behind a URL this client returned, or null when
  // the URL does not point into S3_PUBLIC_URL (e.g. an external link).
  keyFromPublicUrl(url) {
    if (!this.publicBaseUrl || typeof url !== 'string') {
      return null;
    }
    const prefix = `${this.publicBaseUrl}/`;
    if (!url.startsWith(prefix)) {
      return null;
    }
    try {
      return decodeURI(url.slice(prefix.length));
    } catch {
      return null;
    }
  }

  async deleteFile(key) {
    await this.s3.deleteObject({ Bucket: this.bucketName, Key: key }).promise();
    this.logger.info(`Deleted file from S3: ${key}`);
  }

  async deleteFilesInDirectory(dirName) {
    let deletedCount = 0;
    let continuationToken = null;

    try {
      do {
        const listParams = {
          Bucket: this.bucketName,
          Prefix: dirName,
          ContinuationToken: continuationToken,
        };

        const listData = await this.s3.listObjectsV2(listParams).promise();

        if (listData.Contents.length > 0) {
          const deleteParams = {
            Bucket: this.bucketName,
            Delete: {
              Objects: listData.Contents.map((item) => ({ Key: item.Key })),
            },
          };

          const deleteData = await this.s3.deleteObjects(deleteParams).promise();
          deletedCount += deleteData.Deleted.length;
        }

        continuationToken = listData.NextContinuationToken;
      } while (continuationToken);

      this.logger.info(`Deleted ${deletedCount} files from S3 directory: ${dirName}`);
      return { count: deletedCount };
    } catch (error) {
      this.logger.error(`Error deleting files from S3 directory ${dirName}: ${error.message}`);
      throw error;
    }
  }
}

module.exports = S3Client;
