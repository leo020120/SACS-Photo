const { app } = require('@azure/functions');
const { BlobServiceClient, ContainerClient, BlobClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');

app.storageBlob('storageBlobTrigger2', {
    path: 'images/{name}',
    connection: 'userphototest_STORAGE',
    handler: async (blob, context) => {
        const connection_string = process.env['userphototest_STORAGE'];
        context.log(`Storage blob function processed blob "${context.triggerMetadata.name}" with size ${blob.length} bytes, url:${context.triggerMetadata.uri}`);
        
        // Create a BlobServiceClient using the connection string
        const blobServiceClient = BlobServiceClient.fromConnectionString(connection_string);
        context.log(`Create a BlobServiceClient using the connection string`);

        // Get a reference to the source container (images)
        const sourceContainerName = 'images';
        const sourceContainerClient = blobServiceClient.getContainerClient(sourceContainerName);
        context.log(`Get a reference to the source container (images) `);
        
        // Get a reference to the destination container (thumbnails)
        const destinationContainerName = 'thumbnails';
        const destinationContainerClient = blobServiceClient.getContainerClient(destinationContainerName);
        context.log(`Get a reference to the destination container (thumbnails)`);

        const blobUrl = context.triggerMetadata.uri;
        context.log('This is the blob URL:', blobUrl);
        
        try {
            // Get a reference to the source blob
            const sourceBlobClient = await sourceContainerClient.getBlobClient(blobUrl);
            const blobName = uuidv4(); // Generate a unique name for the destination blob
            
            // Create a new blob URL with the generated name in the destination container
            const destinationBlobClient = destinationContainerClient.getBlobClient(blobUrl);
            
            // Start the blob copy operation from the source to the destination container
            await destinationBlobClient.beginCopyFromURL(blobUrl);
            
            // Delete the source blob after it has been copied
            //await sourceBlobClient.delete();
            
            context.log(`Blob moved from "${sourceContainerName}" to "${destinationContainerName}".`);
        } catch (error) {
            context.log(`An error occurred while moving the blob. Error: ${error}`);
        }
    }
});
