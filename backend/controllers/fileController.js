const path = require('path');

exports.downloadDocument = (req, res) => {
    const { fileUrl } = req.query;

    if (!fileUrl) {
        return res.status(400).json({ message: 'fileUrl required' });
    }

    const absolutePath = path.join(process.cwd(), fileUrl);

    res.download(absolutePath);
};
