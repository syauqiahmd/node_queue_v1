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
      this.logger.info(
        `File uploaded successfully to S3: ${data.Location}${expiresInSeconds ? ` (expires in ${expiresInSeconds}s)` : ''}`
      );
      return data.Location;
    } catch (error) {
      this.logger.error(`Error uploading file to S3: ${error.message}`);
      throw error;
    }
  }
}

module.exports = S3Client;
