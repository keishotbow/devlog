const fs = require("fs");
const path = require("path");

function createFileList(folder, outputFile = "filelist.txt", duration = 3) {
    const files = fs.readdirSync(folder).sort();
    let list = "";

    for (const f of files) {
        const ext = path.extname(f).toLowerCase();
        const fullPath = path.join(folder, f);

        if ([".jpg", ".jpeg", ".png"].includes(ext)) {
            list += `file '${fullPath}'\n`;
            list += `duration ${duration}\n`; // 静止画は指定秒数
        }
        else {
            list += `file '${fullPath}'\n`; // 動画はそのまま
        }
    }

    // ファイル書き出し
    fs.writeFileSync(outputFile, list, "utf8");
    console.log(`created ${outputFile}`);
}

module.exports = { createFileList };
