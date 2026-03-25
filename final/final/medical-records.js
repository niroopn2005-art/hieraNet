const { Web3 } = require('web3');
const readline = require('readline');
const MultichainNode = require('multichain-node');
const contractABI = require('./contractABI');
require('dotenv').config();

// Initialize readline interface
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

// Initialize Web3 and MultiChain
const web3 = new Web3(process.env.ETHEREUM_NODE_URL);
const multichain = MultichainNode({
    port: process.env.MULTICHAIN_PORT || 6834,
    host: process.env.MULTICHAIN_HOST || 'localhost',
    user: process.env.MULTICHAIN_USER || 'multichainrpc',
    pass: process.env.MULTICHAIN_PASS
});

// Initialize contract
const contract = new web3.eth.Contract(contractABI, process.env.CONTRACT_ADDRESS);

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

// Helper functions
async function getWalletAddress(privateKey) {
    try {
        const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        const account = web3.eth.accounts.privateKeyToAccount(formattedKey);
        return account.address;
    } catch (error) {
        console.error('Error getting wallet address:', error);
        throw error;
    }
}

async function verifyPatientKey(patientId, privateKey) {
    try {
        // Validate private key format and length
        if (!privateKey || privateKey.length !== 66) { // 32 bytes = 64 chars + '0x'
            console.error('Invalid private key format - must be 32 bytes');
            return false;
        }

        const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
        const account = web3.eth.accounts.privateKeyToAccount(formattedKey);
        const patient = await contract.methods.patients(patientId).call();
        
        return patient.walletAddress.toLowerCase() === account.address.toLowerCase();
    } catch (error) {
        console.error('Error verifying patient key:', error);
        return false;
    }
}

async function verifyMultichainConnection() {
    try {
        return new Promise((resolve, reject) => {
            multichain.getInfo((err, info) => {
                if (err) {
                    console.error('MultiChain connection error:', err);
                    reject(err);
                } else {
                    console.log('MultiChain Connected Successfully');
                    console.log('Chain:', info.chainname);
                    resolve(true);
                }
            });
        });
    } catch (error) {
        console.error('MultiChain verification failed:', error);
        return false;
    }
}

async function checkDoctorExists(doctorId) {
    try {
        return await contract.methods.isDoctorRegistered(doctorId).call();
    } catch (error) {
        console.error('Error checking doctor:', error);
        return false;
    }
}

async function checkAndCreateStream() {
    try {
        const streams = await new Promise((resolve, reject) => {
            multichain.listStreams((err, streams) => {
                if (err) reject(err);
                else resolve(streams);
            });
        });

        const streamName = 'medical_records';
        const streamExists = Array.isArray(streams) && streams.some(stream => stream.name === streamName);

        if (!streamExists) {
            await new Promise((resolve, reject) => {
                multichain.create(['stream', streamName, true], (err) => {
                    if (err) reject(err);
                    else {
                        multichain.subscribe([streamName], (err) => {
                            if (err) reject(err);
                            else {
                                console.log('Created medical_records stream');
                                resolve();
                            }
                        });
                    }
                });
            });
        }
    } catch (error) {
        console.error('Error in stream creation:', error);
        throw error;
    }
}

function stringToHex(str) {
    return Buffer.from(str).toString('hex');
}

async function registerDoctor() {
    try {
        console.log('\n=== Register New Doctor ===');
        const doctorId = await question('Enter Doctor ID: ');
        
        const exists = await checkDoctorExists(doctorId);
        if (exists) {
            console.log('Doctor already registered!');
            return;
        }

        console.log('\nHow would you like to provide the doctor\'s wallet address?');
        console.log('1. Enter wallet address directly');
        console.log('2. Derive from private key');
        const choice = await question('Enter choice (1 or 2): ');

        let doctorAddress;
        if (choice === '2') {
            const privateKey = await question('Enter doctor\'s private key: ');
            doctorAddress = await getWalletAddress(privateKey);
            console.log(`Derived wallet address: ${doctorAddress}`);
        } else {
            const inputAddress = await question('Enter Doctor\'s Ethereum wallet address: ');
            doctorAddress = inputAddress.startsWith('0x') ? inputAddress : `0x${inputAddress}`;
            
            if (!web3.utils.isAddress(doctorAddress)) {
                throw new Error('Invalid Ethereum address format');
            }
        }

        const formattedAdminKey = process.env.ADMIN_PRIVATE_KEY.startsWith('0x') ? 
            process.env.ADMIN_PRIVATE_KEY : 
            `0x${process.env.ADMIN_PRIVATE_KEY}`;

        web3.eth.accounts.wallet.clear();
        const adminAccount = web3.eth.accounts.privateKeyToAccount(formattedAdminKey);
        web3.eth.accounts.wallet.add(adminAccount);

        console.log('Registering doctor...');
        const gas = await contract.methods.registerDoctor(doctorId, doctorAddress)
            .estimateGas({ from: adminAccount.address });

        const gasLimit = Math.floor(Number(gas) * 1.5);

        const result = await contract.methods.registerDoctor(doctorId, doctorAddress)
            .send({ 
                from: adminAccount.address, 
                gas: gasLimit
            });

        console.log(`Doctor registered successfully! Transaction hash: ${result.transactionHash}`);
        console.log('Doctor registration successful');
    } catch (error) {
        console.error('Error registering doctor:', error.message);
    }
}

async function registerPatient() {
    try {
        console.log('\n=== Register New Patient ===');
        const patientId = await question('Enter Patient ID: ');
        const patientAddress = await question('Enter Patient\'s Ethereum wallet address: ');
        const doctorId = await question('Enter registering Doctor ID: ');

        // Check if doctor exists first
        const isDoctorRegistered = await contract.methods.isDoctorRegistered(doctorId).call();
        if (!isDoctorRegistered) {
            console.error(`Error: Doctor ${doctorId} is not registered in the system.`);
            console.log('Please register the doctor first or use a registered doctor ID.');
            return;
        }

        // Validate patient address
        const formattedAddress = patientAddress.startsWith('0x') ? patientAddress : `0x${patientAddress}`;
        if (!web3.utils.isAddress(formattedAddress)) {
            throw new Error('Invalid Ethereum address format');
        }

        // Check if patient already exists
        const isPatientRegistered = await contract.methods.isPatientRegistered(patientId).call();
        if (isPatientRegistered) {
            console.error('Error: Patient ID already registered');
            return;
        }

        // Set up admin account
        const adminKey = process.env.ADMIN_PRIVATE_KEY.startsWith('0x') ? 
            process.env.ADMIN_PRIVATE_KEY : 
            `0x${process.env.ADMIN_PRIVATE_KEY}`;

        web3.eth.accounts.wallet.clear();
        const adminAccount = web3.eth.accounts.privateKeyToAccount(adminKey);
        web3.eth.accounts.wallet.add(adminAccount);

        console.log('\nRegistering patient...');
        
        // Register patient
        const result = await contract.methods.registerPatient(
            patientId,
            doctorId,
            formattedAddress,
            'initial'  // Initial CID
        ).send({
            from: adminAccount.address,
            gas: 3000000
        });

        console.log('\nPatient registered successfully!');
        console.log('Transaction hash:', result.transactionHash);

    } catch (error) {
        if (error.message.includes('Doctor not found')) {
            console.error('Error: Invalid or unregistered doctor ID');
        } else if (error.message.includes('Patient already exists')) {
            console.error('Error: Patient ID already registered');
        } else {
            console.error('Registration error:', error.message);
        }
    }
}

async function updateRecords() {
    try {
        console.log('\n=== Update Medical Records ===');
        const patientId = await question('Enter Patient ID: ');
        const patientPrivateKey = await question('Enter Patient\'s private key: ');
        const doctorId = await question('Enter Doctor ID: ');
        const doctorPrivateKey = await question('Enter Doctor\'s private key: ');

        const isPatientKeyValid = await verifyPatientKey(patientId, patientPrivateKey);
        if (!isPatientKeyValid) {
            console.error('Invalid patient private key');
            return;
        }

        const formattedDoctorKey = doctorPrivateKey.startsWith('0x') ? doctorPrivateKey : `0x${doctorPrivateKey}`;
        
        try {
            const doctorAccount = web3.eth.accounts.privateKeyToAccount(formattedDoctorKey);
            console.log('\nDoctor\'s wallet address:', doctorAccount.address);
            
            const doctor = await contract.methods.doctors(doctorId).call();
            if (!doctor.isRegistered) {
                console.error('\nError: Doctor is not registered in the system');
                console.log('\nPlease register the doctor first using option 1');
                return;
            }

            web3.eth.accounts.wallet.clear();
            web3.eth.accounts.wallet.add(doctorAccount);

            const hasUpdateAccess = await contract.methods.checkUpdateAccess(patientId, doctorId).call();
            if (!hasUpdateAccess) {
                console.error('\nError: Doctor does not have update access');
                console.log('\nNote: Patient must grant update access using "Grant Doctor Access"');
                return;
            }

            console.log('\nSelect record type to update:');
            console.log('1. Private Record (Ethereum)');
            console.log('2. Public Record (MultiChain)');
            const choice = await question('Enter choice (1 or 2): ');

            if (choice === '1') {
                const newCID = await question('Enter new Private CID: ');
                
                console.log('Updating private record...');
                const gas = await contract.methods.updateMedicalRecord(patientId, newCID)
                    .estimateGas({ from: doctorAccount.address });

                const gasLimit = Math.floor(Number(gas) * 1.5);

                const result = await contract.methods.updateMedicalRecord(patientId, newCID)
                    .send({ 
                        from: doctorAccount.address, 
                        gas: gasLimit
                    });
                console.log('\nPrivate record updated successfully!');
                console.log('Transaction hash:', result.transactionHash);
            } else if (choice === '2') {
                const isMultichainConnected = await verifyMultichainConnection();
                if (!isMultichainConnected) {
                    console.error('MultiChain is not properly connected');
                    return;
                }
                
                const newCID = await question('Enter new Public CID: ');
                const hexData = stringToHex(newCID); 
                
                await new Promise((resolve, reject) => {
                    multichain.publish({
                        stream: 'medical_records',
                        key: patientId,
                        data: hexData
                    }, (err) => {
                        if (err) {
                            console.error('MultiChain publish error:', err);
                            reject(err);
                        } else {
                            console.log('\nPublic record updated successfully on MultiChain!');
                            resolve();
                        }
                    });
                });
            }

            // Auto-revoke update access after update
            const patientAccount = web3.eth.accounts.privateKeyToAccount(
                patientPrivateKey.startsWith('0x') ? patientPrivateKey : `0x${patientPrivateKey}`
            );
            web3.eth.accounts.wallet.clear();
            web3.eth.accounts.wallet.add(patientAccount);

            await contract.methods.revokeAccess(doctorId, false, false)
                .send({ from: patientAccount.address, gas: 3000000 });

        } catch (error) {
            if (error.message.includes('Doctor not found')) {
                console.error('\nError: Doctor is not properly registered or authenticated');
                console.log('\nPlease register the doctor first using option 1');
            } else {
                console.error('Contract interaction error:', error);
            }
        }
    } catch (error) {
        console.error('Error updating records:', error.message);
    }
}

async function viewRecords() {
    try {
        console.log('\n=== View Medical Records ===');
        const patientId = await question('Enter Patient ID: ');
        const patientPrivateKey = await question('Enter Patient\'s private key: ');
        const doctorPrivateKey = await question('Enter Doctor\'s private key: ');

        const isPatientKeyValid = await verifyPatientKey(patientId, patientPrivateKey);
        if (!isPatientKeyValid) {
            console.error('Invalid patient private key');
            return;
        }

        const formattedDoctorKey = doctorPrivateKey.startsWith('0x') ? doctorPrivateKey : `0x${doctorPrivateKey}`;
        
        try {
            const doctorAccount = web3.eth.accounts.privateKeyToAccount(formattedDoctorKey);
            console.log('\nDoctor\'s wallet address:', doctorAccount.address);
            
            let foundDoctorId;
            try {
                foundDoctorId = await contract.methods.getDoctorId(doctorAccount.address).call();
            } catch (error) {
                console.error('\nError: No registered doctor found for this private key');
                console.log('Please register the doctor first using option 1');
                return;
            }
            
            console.log(`Found registered doctor ID: ${foundDoctorId}`);
            
            web3.eth.accounts.wallet.clear();
            web3.eth.accounts.wallet.add(doctorAccount);

            const hasViewAccess = await contract.methods.checkViewAccess(patientId, foundDoctorId).call();
            if (!hasViewAccess) {
                console.error('\nError: Doctor does not have view access');
                console.log('\nNote: Patient must grant view access using "Grant Doctor Access"');
                return;
            }

            console.log('\nFetching records...');
            
            let privateCID;
            try {
                privateCID = await contract.methods.viewMedicalRecord(patientId)
                    .call({ from: doctorAccount.address });
            } catch (error) {
                privateCID = 'No private record found or access denied';
            }

            let publicCID = 'No public record found';
            try {
                const isMultichainConnected = await verifyMultichainConnection();
                if (!isMultichainConnected) {
                    console.error('Warning: MultiChain is not properly connected');
                    publicCID = 'MultiChain connection error';
                } else {
                    const publicRecords = await new Promise((resolve, reject) => {
                        multichain.listStreamKeyItems(['medical_records', patientId], (err, items) => {
                            if (err) {
                                console.error('MultiChain fetch error:', err);
                                reject(err);
                            } else {
                                resolve(items || []);
                            }
                        });
                    });

                    if (publicRecords && publicRecords.length > 0) {
                        const hexData = publicRecords[publicRecords.length - 1].data;
                        publicCID = Buffer.from(hexData, 'hex').toString();
                    }
                }
            } catch (error) {
                console.error('Error fetching public records:', error.message);
                publicCID = 'Error fetching from MultiChain';
            }

            console.log('\nPrivate CID:', privateCID);
            console.log('Public CID:', publicCID);

            // Auto-revoke view access after viewing
            const patientAccount = web3.eth.accounts.privateKeyToAccount(
                patientPrivateKey.startsWith('0x') ? patientPrivateKey : `0x${patientPrivateKey}`
            );
            web3.eth.accounts.wallet.clear();
            web3.eth.accounts.wallet.add(patientAccount);

            await contract.methods.grantAccess(foundDoctorId, false, false)
                .send({ from: patientAccount.address, gas: 3000000 });

        } catch (error) {
            if (error.message.includes('Doctor not found')) {
                console.error('\nError: Doctor is not properly registered or authenticated');
                console.log('\nPlease register the doctor first using option 1');
            } else {
                console.error('Contract interaction error:', error);
            }
        }
    } catch (error) {
        console.error('Error viewing records:', error.message);
    }
}

async function grantDoctorAccess() {
    try {
        console.log('\n=== Grant Doctor Access ===');
        const patientId = await question('Enter Patient ID: ');
        const patientPrivateKey = await question('Enter Patient\'s private key: ');
        const doctorId = await question('Enter Doctor ID to grant access: ');

        console.log('\nSelect access type:');
        console.log('1. View Only');
        console.log('2. Update Only');
        console.log('3. Both View and Update');
        const choice = await question('Enter choice (1-3): ');

        const isPatientKeyValid = await verifyPatientKey(patientId, patientPrivateKey);
        if (!isPatientKeyValid) {
            console.error('Invalid patient credentials');
            return;
        }

        const formattedPatientKey = patientPrivateKey.startsWith('0x') ? 
            patientPrivateKey : 
            `0x${patientPrivateKey}`;
        const patientAccount = web3.eth.accounts.privateKeyToAccount(formattedPatientKey);

        const doctorExists = await checkDoctorExists(doctorId);
        if (!doctorExists) {
            console.error('Doctor not found');
            return;
        }

        let canView = false;
        let canUpdate = false;

        switch(choice) {
            case '1':
                canView = true;
                break;
            case '2':
                canUpdate = true;
                break;
            case '3':
                canView = true;
                canUpdate = true;
                break;
            default:
                console.error('Invalid choice');
                return;
        }

        web3.eth.accounts.wallet.clear();
        web3.eth.accounts.wallet.add(patientAccount);

        const gas = await contract.methods.grantAccess(doctorId, canView, canUpdate)
            .estimateGas({ from: patientAccount.address });

        const gasLimit = Math.floor(Number(gas) * 1.5);

        const result = await contract.methods.grantAccess(doctorId, canView, canUpdate)
            .send({ 
                from: patientAccount.address,
                gas: gasLimit
            });

        console.log('\nAccess granted successfully!');
        if (canView) console.log('- View access granted');
        if (canUpdate) console.log('- Update access granted');
        console.log('Transaction hash:', result.transactionHash);

        // Verify access was granted
        const hasViewAccess = await contract.methods.checkViewAccess(patientId, doctorId).call();
        const hasUpdateAccess = await contract.methods.checkUpdateAccess(patientId, doctorId).call();
        
        console.log('\nAccess verification:');
        console.log('View access:', hasViewAccess ? 'Granted' : 'Not granted');
        console.log('Update access:', hasUpdateAccess ? 'Granted' : 'Not granted');

    } catch (error) {
        console.error('Error granting access:', error.message);
    }
}

async function revokeDoctorAccess() {
    try {
        console.log('\n=== Revoke Doctor Access ===');
        const patientId = await question('Enter Patient ID: ');
        const patientPrivateKey = await question('Enter Patient\'s private key: ');
        const doctorId = await question('Enter Doctor ID to revoke access: ');

        const isPatientKeyValid = await verifyPatientKey(patientId, patientPrivateKey);
        if (!isPatientKeyValid) {
            console.error('Invalid patient credentials');
            return;
        }

        const formattedPatientKey = patientPrivateKey.startsWith('0x') ? 
            patientPrivateKey : 
            `0x${patientPrivateKey}`;
        const patientAccount = web3.eth.accounts.privateKeyToAccount(formattedPatientKey);

        const doctorExists = await checkDoctorExists(doctorId);
        if (!doctorExists) {
            console.error('Doctor not found');
            return;
        }

        web3.eth.accounts.wallet.clear();
        web3.eth.accounts.wallet.add(patientAccount);

        const gas = await contract.methods.revokeAccess(doctorId)
            .estimateGas({ from: patientAccount.address });

        const gasLimit = Math.floor(Number(gas) * 1.5);

        const result = await contract.methods.revokeAccess(doctorId)
            .send({ 
                from: patientAccount.address,
                gas: gasLimit
            });

        console.log('\nAll access revoked successfully!');
        console.log('Transaction hash:', result.transactionHash);

        // Verify access was revoked
        const hasViewAccess = await contract.methods.checkViewAccess(patientId, doctorId).call();
        const hasUpdateAccess = await contract.methods.checkUpdateAccess(patientId, doctorId).call();
        
        console.log('\nAccess verification:');
        console.log('View access:', hasViewAccess ? 'Still granted (error)' : 'Revoked');
        console.log('Update access:', hasUpdateAccess ? 'Still granted (error)' : 'Revoked');

    } catch (error) {
        console.error('Error revoking access:', error.message);
    }
}

async function init() {
    console.log('Initializing Medical Records Management System...');
    try {
        const networkId = await web3.eth.net.getId();
        console.log('Connected to Ethereum network ID:', networkId);
        
        const isMultichainConnected = await verifyMultichainConnection();
        if (!isMultichainConnected) {
            console.error('Failed to connect to MultiChain');
            process.exit(1);
        }
        
        await checkAndCreateStream();
        await mainMenu();
    } catch (error) {
        console.error('Initialization error:', error);
        process.exit(1);
    }
}

async function mainMenu() {
    try {
        let exit = false;
        while (!exit) {
            console.log('\n=== Medical Records Management System ===');
            console.log('1. Register Doctor');
            console.log('2. Register Patient');
            console.log('3. Update Medical Records');
            console.log('4. View Medical Records');
            console.log('5. Grant Doctor Access');
            console.log('6. Revoke Doctor Access');
            console.log('7. Exit');
            const choice = await question('Enter your choice: ');

            switch (choice) {
                case '1':
                    await registerDoctor();
                    break;
                case '2':
                    await registerPatient();
                    break;
                case '3':
                    await updateRecords();
                    break;
                case '4':
                    await viewRecords();
                    break;
                case '5':
                    await grantDoctorAccess();
                    break;
                case '6':
                    await revokeDoctorAccess();
                    break;
                case '7':
                    exit = true;
                    break;
                default:
                    console.log('Invalid choice. Please try again.');
            }
        }
    } catch (error) {
        console.error('Error in main function:', error.message);
    } finally {
        rl.close();
    }
}

init();