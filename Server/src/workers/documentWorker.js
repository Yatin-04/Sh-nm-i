import { Queue, Worker } from 'bullmq';
import IORedis from 'ioredis';
import { processDocument } from '../services/documentService.js';
import dotenv from 'dotenv';
dotenv.config();

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
    maxRetriesPerRequest: null // Required by BullMQ
});

// Create the Queue
export const documentQueue = new Queue('document-processing', { connection });

// Define the Worker
const worker = new Worker('document-processing', async (job) => {
    console.log(`Processing job ${job.id} for document ${job.data.documentId}...`);
    
    const { documentId, fileUrl, fileType } = job.data;
    
    try {
        // Download the file from Cloudinary
        console.log(`Downloading file from: ${fileUrl}`);
        const response = await fetch(fileUrl);
        
        if (!response.ok) {
            throw new Error(`Failed to download file: ${response.status} ${response.statusText}`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        
        console.log(`Downloaded ${buffer.length} bytes for job ${job.id}`);

        if (buffer.length === 0) {
            throw new Error(`Downloaded file is empty (0 bytes). URL: ${fileUrl}`);
        }
        
        await processDocument(documentId, buffer, fileType);
        
        console.log(`Successfully processed job ${job.id}`);
        return { success: true, documentId };
    } catch (error) {
        console.error(`Error processing job ${job.id}:`, error);
        throw error; // Let BullMQ handle retries
    }
}, { 
    connection,
    concurrency: 5 // Process 5 PDFs concurrently
});

worker.on('failed', (job, err) => {
    console.error(`Job ${job.id} failed with error ${err.message}`);
});

export const initWorker = () => {
    console.log("BullMQ Document Worker Initialized.");
};
