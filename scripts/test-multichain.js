const MultichainNode = require('multichain-node');

const multichain = MultichainNode({
    port: 6834,
    host: 'localhost',
    user: 'multichainrpc',
    pass: process.env.MULTICHAIN_PASS
});

async function testMultichain() {
    try {
        // Test publish
        await new Promise((resolve, reject) => {
            multichain.publish({
                stream: 'medical_records',
                key: 'test_patient',
                data: Buffer.from('test_cid').toString('hex')
            }, (err, result) => {
                if (err) {
                    console.error('Publish error:', err);
                    reject(err);
                } else {
                    console.log('Publish success:', result);
                    resolve(result);
                }
            });
        });

        // Test retrieve
        await new Promise((resolve, reject) => {
            multichain.listStreamItems({
                stream: 'medical_records'
            }, (err, items) => {
                if (err) {
                    console.error('Retrieve error:', err);
                    reject(err);
                } else {
                    console.log('Stream items:', items);
                    resolve(items);
                }
            });
        });

    } catch (error) {
        console.error('Test failed:', error);
    }
}

testMultichain();
