const { execSync } = require("child_process");
const { createFileList } = require("./create_filelist");
const fs = require("fs");
const { json } = require("express");

// 設定ファイルを読み込む
const config = JSON.parse(fs.readFileSync("config.json", "utf8"));

const {
    inputFolder,
    filelist,
    outputFile,
    width,
    height,
    framerate,
    duration,
    bgm
} = config;

createFileList(inputFolder, filelist, duration);

// スライドショー生成
const cmdSlideshow = `ffmpeg -y -f concat -safe 0 -i ${filelist} \
    -vf "scale=${width}:${height}:force_original_aspect_ratio=decrease,pad=${width}:${height}:(ow-iw)/2:(oh-ih)/2:black" \
    -c:v libx264 -r 30 -pix_fmt yuv420p -an ${outputFile}`;

console.log("running:", cmdSlideshow);
execSync(cmdSlideshow, { stdio: "inherit" });

const cmdShowFileStats = `ffprobe -v quiet -print_format json -show_format -show_streams ${outputFile}`;
// console.log("running:", cmdShowFileStats);
execSync(cmdShowFileStats, (err, stdout, stderr) => {
    if (err) {
        console.error(`Error: ${err}`);
        return;
    }
    const stats = JSON.parse(stdout.toString());

    console.log(`${JSON.stringify(stats, null, 4)}`);
});
// const stats = JSON.parse(output.toString());

// console.log(`${JSON.stringify(stats, null, 4)}`);

// BGM合成
// TODO
// const cmdMerge = `ffmpeg -y -i tmp.mp4 -i ${bgm}  -c:v copy -c:a aac -shortest ${outputFile}`;
// console.log("running:", cmdMerge);
// exec(cmdMerge, { stdio: "inherit" });

const createSlideshow = () => {
    const cmd = `
    ffmpeg -y -framerate 1/3 -i images/img%d.jpeg \
    -vf "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2:black" \
    -c:v libx264 -r 30 -pix_fmt yuv420p slideshow.mp4
    `;

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.error("Error:", err);
            return;
        }
        console.log("Video created: slideshow.mp4");
    });
};
