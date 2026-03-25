const IPFSUtil = require('../utils/ipfsUtils');
const { spawn } = require('child_process');
const path = require('path');
const ipfs = new IPFSUtil();

exports.registerPatient = async (req, res) => {
    try {
        console.log('Starting patient registration process...');

        // First, run the Python script to classify and generate CSV files
        const pythonScript = spawn('python', [
            path.join(process.cwd(), 'scripts', 'classify_data.py'),
            JSON.stringify(req.body)  // Pass patient data to Python script
        ]);

        let pythonOutput = '';
        let pythonError = '';

        pythonScript.stdout.on('data', (data) => {
            pythonOutput += data.toString();
        });

        pythonScript.stderr.on('data', (data) => {
            console.log('Python Script Log:', data.toString());
            pythonError += data.toString();
        });

        // Wait for Python script to complete
        await new Promise((resolve, reject) => {
            pythonScript.on('close', (code) => {
                if (code !== 0) {
                    reject(new Error(`Python script failed with code ${code}: ${pythonError}`));
                } else {
                    resolve();
                }
            });
        });

        // Parse the Python script output to get file paths and other data
        const pythonResult = JSON.parse(pythonOutput);
        console.log('Python Script Result:', pythonResult);

        // Get the most recent CSV files from the data directory
        const dataDir = path.join(process.cwd(), 'data');
        const files = fs.readdirSync(dataDir);
        
        const privateCSVPath = path.join(dataDir, files.find(f => f.startsWith('private_data_')));
        const publicCSVPath = path.join(dataDir, files.find(f => f.startsWith('public_data_')));

        console.log('CSV Paths:', {
            private: privateCSVPath,
            public: publicCSVPath
        });

        // Verify files exist
        if (!fs.existsSync(privateCSVPath) || !fs.existsSync(publicCSVPath)) {
            throw new Error('CSV files not found');
        }

        // Upload both files to IPFS
        console.log('Starting IPFS uploads...');
        
        const [privateCID, publicCID] = await Promise.all([
            ipfs.uploadToIPFS(privateCSVPath),
            ipfs.uploadToIPFS(publicCSVPath)
        ]);

        console.log('IPFS Upload Results:', {
            privateCID,
            publicCID
        });

        // Save patient data and IPFS CIDs to database
        const patient = new Patient({
            ...req.body,
            ipfsData: {
                privateCID,
                publicCID
            }
        });
        await patient.save();

        const response = {
            success: true,
            message: 'Patient registered successfully',
            patientId: patient._id,
            ipfsData: {
                private: {
                    cid: privateCID,
                    url: `https://gateway.pinata.cloud/ipfs/${privateCID}`
                },
                public: {
                    cid: publicCID,
                    url: `https://gateway.pinata.cloud/ipfs/${publicCID}`
                }
            }
        };

        console.log('Sending response:', response);
        res.status(200).json(response);

    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error registering patient',
            error: error.message
        });
    }
} 