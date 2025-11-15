import { Storage } from "@google-cloud/storage";
import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import e from "express";

const storage = new Storage();

const rawVideosBucketName = "lorenzo-rod-raw-videos-bucket";
const processedVideosBucketName = "lorenzo-rod-processed-videos-bucket";

const localRawVideoPath = "./raw_videos";
const localProcessedVideoPath = "./processed_videos";

/**
 * Creates local directories for raw and processed videos
 */
export function setUpDirectories() {
    ensureDirectoryExists(localRawVideoPath);
    ensureDirectoryExists(localProcessedVideoPath);
}

/**
 * 
 * @param rawVideoName The name of the file to convert from {@link localRawVideoPath}
 * @param processedVideoName The name of the file to convert to {@link localProcessedVideoPath}
 * @returns A promise which resolves when the video has been converted
 */
export function convertVideo(rawVideoName: string, processedVideoName: string): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        ffmpeg(`${localRawVideoPath}/${rawVideoName}`)
            .outputOptions("-vf", "scale=-1:360") // Resize video to 360p
            .on("end", () => {
                console.log("Video processing finished successfully.");
                resolve();
            })
            .on("error", (err) => {
                console.error(`Error processing video: ${err.message}`);
                reject(err);
            })
            .save(`${localProcessedVideoPath}/${processedVideoName}`);
    });
}

/**
 * 
 * @param fileName The name of the file to download
 * {@link rawVideosBucketName} Bucket into the {@link localRawVideoPath} folder
 * @returns A promise that resolves when the file has been downloaded
 */
export async function downloadRawVideo(fileName: string) {
    await storage.bucket(rawVideosBucketName)
        .file(fileName)
        .download({ destination: `${localRawVideoPath}/${fileName}` });

    console.log(`gs://${rawVideosBucketName}/${fileName} downloaded to ${localRawVideoPath}/${fileName}`);
}

/**
 * 
 * @param fileName The name of the file to upload
 * {@link localProcessedVideoPath} folder into the {@link processedVideosBucketName}
 * @returns A promise that resolves when the video has been uploaded
 */
export async function uploadProcessedVideo(fileName: string) {
    const bucket = storage.bucket(processedVideosBucketName);

    await bucket.upload(`${localProcessedVideoPath}/${fileName}`, {
        destination: fileName,
    });

    console.log(`Uploaded ${fileName} to gs://${processedVideosBucketName}/${fileName}`);

    await bucket.file(fileName).makePublic();

    console.log(`gs://${processedVideosBucketName}/${fileName} is now public.`);
}

/**
 * 
 * @param path The path of the file to delete
 * @returns A promise that resolve when the file was not found or when it was deleted
 */
function deleteFile(path: string) {
    return new Promise<void>((resolve, reject) => {
        fs.unlink(path, (err) => {
            if (err) {
                if (err.code === 'ENOENT') {
                    console.log(`File not found, could not delete: ${path}`);
                    resolve();
                } else {
                    reject(err);
                }
            } else {
                console.log(`Deleted file: ${path}`);
                resolve();
            }
        });
    });
}

/**
 * 
 * @param fileName File name of the video to be deleted
 * @returns A promise that resolves when the video is deleted or not found
 */
export function deleteRawVideo(fileName: string) {
    return deleteFile(`${localRawVideoPath}/${fileName}`);
}

/** 
 * 
 * @param fileName File name of the video to be deleted
 * @returns A promise that resolves when the video is deleted or not found
 */
export function deleteProcessedVideo(fileName: string) {
    return deleteFile(`${localProcessedVideoPath}/${fileName}`);
}

/**
 * Ensures that a directory exists, creating it if necessary
 * @param path The directory path to ensure exists
 */
function ensureDirectoryExists(path: string) {
    if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
        console.log(`Created directory: ${path}`);
    }
}
