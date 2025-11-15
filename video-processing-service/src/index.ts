import express from "express";
import { convertVideo, deleteProcessedVideo, deleteRawVideo, downloadRawVideo, setUpDirectories, uploadProcessedVideo } from "./storage";

setUpDirectories();

const app = express();
app.use(express.json());

app.post("/process-video", async (req, res) => {

    let data;
    try {
        const message = Buffer.from(req.body.message.data, "base64").toString();
        data = JSON.parse(message);
        if (!data.name) {
            throw new Error("Missing 'name' field in message data");
        }
    } catch (error) {
        console.error("Error parsing request body:", error);
        return res.status(400).send("Invalid request body: missing filename");
    }

    const rawVideoName = data.name;
    const processedVideoName = `processed-${rawVideoName}`;

    await downloadRawVideo(rawVideoName);

    try {
        await convertVideo(rawVideoName, processedVideoName);
    } catch (error) {

        console.error("Error during video conversion:", error);
        return res.status(500).send("Error processing video");
    }

    await uploadProcessedVideo(processedVideoName);

    await Promise.all([
        deleteRawVideo(rawVideoName),
        deleteProcessedVideo(processedVideoName)
    ]);

    res.status(200).send("Video processed successfully");

});


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Video Processing Service listening at http://localhost:${port}`);
});