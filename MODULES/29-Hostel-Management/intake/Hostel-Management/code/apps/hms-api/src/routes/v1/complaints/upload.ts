import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { requirePermission } from '../../../plugins/permissions';
import { ensureTenantIsolation } from '../../../plugins/tenant';
import { PERMISSIONS } from '../../../lib/permissions';
import { config } from '../../../config';

// In production, use AWS SDK or MinIO client
// This is a simplified implementation
export async function complaintUploadRoutes(fastify: FastifyInstance) {
  // POST get upload URL
  fastify.post('/upload-url', {
    preHandler: [
      requirePermission(PERMISSIONS.COMPLAINT_CREATE),
      ensureTenantIsolation('complaint'),
    ],
    schema: {
      body: z.object({
        filename: z.string().min(1),
        contentType: z.string().regex(/^(image\/(jpeg|png|webp))$/),
      }),
    },
  }, async (request, reply) => {
    const { filename, contentType } = request.body as any;
    const orgId = request.tenant.orgId;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(contentType)) {
      return reply.status(400).send({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Only JPEG, PNG, and WebP images are allowed',
        },
      });
    }

    // Generate unique key
    const key = `complaints/${orgId}/${Date.now()}-${filename}`;

    // In production, generate presigned URL from S3/MinIO
    const uploadUrl = await generatePresignedUrl(key, contentType);

    return {
      uploadUrl,
      key,
      expiresIn: 3600, // 1 hour
    };
  });
}

// Helper function to generate presigned URL
// In production, implement with AWS SDK or MinIO client
async function generatePresignedUrl(key: string, contentType: string): Promise<string> {
  // This is a mock implementation
  // In production, use:
  // const s3 = new S3Client({ ... });
  // const command = new PutObjectCommand({ Bucket: config.s3Bucket, Key: key, ContentType: contentType });
  // return await getSignedUrl(s3, command, { expiresIn: 3600 });

  // Mock URL for development
  return `http://${config.s3Endpoint}/${config.s3Bucket}/${key}?presigned=123`;
}