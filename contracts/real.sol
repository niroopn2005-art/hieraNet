// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalRecords {
    struct Doctor {
        bool isRegistered;
        address walletAddress;
        mapping(string => bool) viewAccess;    // patientId => hasViewAccess
        mapping(string => bool) updateAccess;   // patientId => hasUpdateAccess
    }

    struct Patient {
        bool isRegistered;
        address walletAddress;
        string[] privateCIDs;     // Array of CIDs
        string registeredBy;
        string patientId;         // Added to store patient ID
    }

    struct AccessRecord {
        string doctorId;
        uint256 timestamp;
        bool isGranted;  // true for granted, false for revoked
    }

    address public admin;

    mapping(string => Doctor) public doctors;
    mapping(string => Patient) public patients;
    mapping(address => string) public walletToPatientId;
    mapping(address => string) public walletToDoctorId;
    mapping(string => AccessRecord[]) private patientAccessHistory;  // patientId => AccessRecord[]
    mapping(string => uint256) private lastLoginTimestamp;  // patientId => timestamp

    event DoctorRegistered(string doctorId, address walletAddress);
    event PatientRegistered(string patientId, string doctorId);
    event ViewAccessGranted(string patientId, string doctorId);
    event UpdateAccessGranted(string patientId, string doctorId);
    event ViewAccessRevoked(string patientId, string doctorId);
    event UpdateAccessRevoked(string patientId, string doctorId);
    event RecordUpdated(string patientId, string doctorId);
    event PatientLoggedIn(string patientId, uint256 timestamp);
    event AccessHistoryUpdated(string patientId, string doctorId, bool isGranted);

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin can perform this action");
        _;
    }

    modifier onlyRegisteredDoctor(string memory doctorId) {
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(doctors[doctorId].walletAddress == msg.sender, "Not authorized");
        _;
    }

    modifier onlyPatientOwner(string memory patientId) {
        require(patients[patientId].isRegistered, "Patient not registered");
        require(patients[patientId].walletAddress == msg.sender, "Not patient owner");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    function registerDoctor(string memory doctorId, address walletAddress) 
        external 
        onlyAdmin 
    {
        require(!doctors[doctorId].isRegistered, "Doctor already registered");
        require(walletAddress != address(0), "Invalid wallet address");
        require(bytes(walletToDoctorId[walletAddress]).length == 0, "Wallet address already registered");

        doctors[doctorId].isRegistered = true;
        doctors[doctorId].walletAddress = walletAddress;
        walletToDoctorId[walletAddress] = doctorId;

        emit DoctorRegistered(doctorId, walletAddress);
    }

    function registerPatient(
        string memory patientId,
        string memory doctorId,
        address patientAddress,
        string memory initialPrivateCID
    ) 
        external 
    {
        require(!patients[patientId].isRegistered, "Patient already registered");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(patientAddress != address(0), "Invalid patient address");
        require(bytes(walletToPatientId[patientAddress]).length == 0, "Wallet address already registered");

        // Initialize empty array for privateCIDs
        patients[patientId].privateCIDs = new string[](0);
        
        // Set patient data
        patients[patientId].isRegistered = true;
        patients[patientId].walletAddress = patientAddress;
        patients[patientId].privateCIDs.push(initialPrivateCID);
        patients[patientId].registeredBy = doctorId;
        patients[patientId].patientId = patientId;  // Store patient ID
        
        // Map wallet to patient ID
        walletToPatientId[patientAddress] = patientId;

        emit PatientRegistered(patientId, doctorId);
    }

    function grantAccess(string memory doctorId, bool canView, bool canUpdate) 
        external 
    {
        string memory patientId = walletToPatientId[msg.sender];
        require(bytes(patientId).length > 0, "Patient not found");
        require(patients[patientId].isRegistered, "Patient not registered");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(msg.sender == patients[patientId].walletAddress, "Not authorized");

        if (canView) {
            doctors[doctorId].viewAccess[patientId] = true;
            emit ViewAccessGranted(patientId, doctorId);
        }
        if (canUpdate) {
            doctors[doctorId].updateAccess[patientId] = true;
            emit UpdateAccessGranted(patientId, doctorId);
        }
    }

    function revokeAccess(string memory doctorId) 
        external 
    {
        string memory patientId = walletToPatientId[msg.sender];
        require(bytes(patientId).length > 0, "Patient not found");
        require(patients[patientId].isRegistered, "Patient not registered");
        require(msg.sender == patients[patientId].walletAddress, "Not authorized");
        require(doctors[doctorId].isRegistered, "Doctor not registered");

        if (doctors[doctorId].viewAccess[patientId]) {
            doctors[doctorId].viewAccess[patientId] = false;
            emit ViewAccessRevoked(patientId, doctorId);
        }
        if (doctors[doctorId].updateAccess[patientId]) {
            doctors[doctorId].updateAccess[patientId] = false;
            emit UpdateAccessRevoked(patientId, doctorId);
        }
    }

    function updateMedicalRecord(string memory patientId, string memory newPrivateCID) 
        external 
    {
        require(patients[patientId].isRegistered, "Patient not registered");
        
        string memory doctorId = walletToDoctorId[msg.sender];
        require(bytes(doctorId).length > 0, "Doctor not found");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(doctors[doctorId].updateAccess[patientId], "No update access");

        patients[patientId].privateCIDs.push(newPrivateCID);  // Push to array instead of replacing
        emit RecordUpdated(patientId, doctorId);
    }

    function viewMedicalRecord(string memory patientId) 
        external 
        view 
        returns (string memory) 
    {
        require(patients[patientId].isRegistered, "Patient not registered");
        
        string memory doctorId = walletToDoctorId[msg.sender];
        require(bytes(doctorId).length > 0, "Doctor not found");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(doctors[doctorId].viewAccess[patientId], "No view access");

        uint256 length = patients[patientId].privateCIDs.length;
        require(length > 0, "No records found");
        return patients[patientId].privateCIDs[length - 1];  // Return latest CID
    }

    function viewAllMedicalRecords(string memory patientId) 
        external 
        view 
        returns (string[] memory) 
    {
        require(patients[patientId].isRegistered, "Patient not registered");
        
        string memory doctorId = walletToDoctorId[msg.sender];
        require(bytes(doctorId).length > 0, "Doctor not found");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(doctors[doctorId].viewAccess[patientId], "No view access");

        return patients[patientId].privateCIDs;  // Return all CIDs
    }

    function checkViewAccess(string memory patientId, string memory doctorId) 
        external 
        view 
        returns (bool) 
    {
        require(patients[patientId].isRegistered, "Patient not registered");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        return doctors[doctorId].viewAccess[patientId];
    }

    function checkUpdateAccess(string memory patientId, string memory doctorId) 
        external 
        view 
        returns (bool) 
    {
        require(patients[patientId].isRegistered, "Patient not registered");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        return doctors[doctorId].updateAccess[patientId];
    }

    function getDoctorId(address wallet) 
        external 
        view 
        returns (string memory) 
    {
        string memory doctorId = walletToDoctorId[wallet];
        require(bytes(doctorId).length > 0, "Doctor not found");
        return doctorId;
    }

    function getPatientId(address wallet) 
        external 
        view 
        returns (string memory) 
    {
        string memory patientId = walletToPatientId[wallet];
        require(bytes(patientId).length > 0, "Patient not found");
        return patientId;
    }

    function isDoctorRegistered(string memory doctorId) 
        external 
        view 
        returns (bool) 
    {
        return doctors[doctorId].isRegistered;
    }

    function isPatientRegistered(string memory patientId) 
        external 
        view 
        returns (bool) 
    {
        return patients[patientId].isRegistered;
    }

    // Add helper function for wallet checks
    function isWalletRegistered(address wallet) 
        public 
        view 
        returns (bool) 
    {
        return bytes(walletToPatientId[wallet]).length > 0;
    }

    function verifyPatientLogin(string memory patientId, address walletAddress) 
        external 
        returns (bool) 
    {
        require(patients[patientId].isRegistered, "Patient not registered");
        require(patients[patientId].walletAddress == walletAddress, "Invalid wallet address");
        
        lastLoginTimestamp[patientId] = block.timestamp;
        emit PatientLoggedIn(patientId, block.timestamp);
        return true;
    }

    function getPatientAccessHistory(string memory patientId) 
        external 
        view 
        returns (AccessRecord[] memory) 
    {
        require(
            msg.sender == patients[patientId].walletAddress || 
            bytes(walletToDoctorId[msg.sender]).length > 0,
            "Not authorized"
        );
        return patientAccessHistory[patientId];
    }

    function _updateAccessHistory(string memory patientId, string memory doctorId, bool isGranted) 
        private 
    {
        AccessRecord memory record = AccessRecord({
            doctorId: doctorId,
            timestamp: block.timestamp,
            isGranted: isGranted
        });
        patientAccessHistory[patientId].push(record);
        emit AccessHistoryUpdated(patientId, doctorId, isGranted);
    }

    function getLastLoginTimestamp(string memory patientId) 
        external 
        view 
        returns (uint256) 
    {
        require(
            msg.sender == patients[patientId].walletAddress || 
            bytes(walletToDoctorId[msg.sender]).length > 0,
            "Not authorized"
        );
        return lastLoginTimestamp[patientId];
    }
}