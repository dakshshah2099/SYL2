const https = require('https');

const url = 'https://api.postalpincode.in/pincode/110001';

https.get(url, (res) => {
    let data = '';

    res.on('data', (chunk) => {
        data += chunk;
    });

    res.on('end', () => {
        console.log(JSON.stringify(JSON.parse(data), null, 2));
    });

}).on("error", (err) => {
    console.log("Error: " + err.message);
});
