// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract MedicalRecords {
    struct Doctor {
        bool isRegistered;
        address walletAddress;
        mapping(string => bool) patientAccess; // patientId => hasAccess
    }

    struct Patient {
        bool isRegistered;
        address walletAddress;
        string privateCID;
        string registeredBy; // doctorId who registered the patient
    }

    // Admin address that can register doctors
    address public admin;

    // Mappings
    mapping(string => Doctor) public doctors; // doctorId => Doctor
    mapping(string => Patient) public patients; // patientId => Patient
    mapping(address => string) public walletToPatientId; // wallet => patientId
    mapping(address => string) public walletToDoctorId; // wallet => doctorId

    // Events
    event DoctorRegistered(string doctorId, address walletAddress);
    event PatientRegistered(string patientId, string doctorId);
    event AccessGranted(string patientId, string doctorId);
    event AccessRevoked(string patientId, string doctorId);
    event RecordUpdated(string patientId, string doctorId);

    // Modifiers
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

    // Constructor
    constructor() {
        admin = msg.sender;
    }

    // Register a new doctor
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

    // Register a new patient
    function registerPatient(
        string memory patientId,
        string memory doctorId,
        address patientAddress,
        string memory initialPrivateCID
    ) 
        external 
        onlyAdmin 
    {
        require(!patients[patientId].isRegistered, "Patient already registered");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(patientAddress != address(0), "Invalid patient address");
        require(bytes(walletToPatientId[patientAddress]).length == 0, "Wallet address already registered");

        patients[patientId].isRegistered = true;
        patients[patientId].walletAddress = patientAddress;
        patients[patientId].privateCID = initialPrivateCID;
        patients[patientId].registeredBy = doctorId;
        walletToPatientId[patientAddress] = patientId;

        // Grant access to registering doctor
        doctors[doctorId].patientAccess[patientId] = true;

        emit PatientRegistered(patientId, doctorId);
        emit AccessGranted(patientId, doctorId);
    }

    // Grant access to a doctor
    function grantAccess(string memory doctorId) 
        external 
    {
        string memory patientId = walletToPatientId[msg.sender];
        require(bytes(patientId).length > 0, "Patient not found");
        require(patients[patientId].isRegistered, "Patient not registered");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(msg.sender == patients[patientId].walletAddress, "Not authorized");

        doctors[doctorId].patientAccess[patientId] = true;
        emit AccessGranted(patientId, doctorId);
    }

    // Revoke access from a doctor
    function revokeAccess(string memory doctorId) 
        external 
    {
        string memory patientId = walletToPatientId[msg.sender];
        require(bytes(patientId).length > 0, "Patient not found");
        require(patients[patientId].isRegistered, "Patient not registered");
        require(msg.sender == patients[patientId].walletAddress, "Not authorized");
        require(doctors[doctorId].isRegistered, "Doctor not registered");

        doctors[doctorId].patientAccess[patientId] = false;
        emit AccessRevoked(patientId, doctorId);
    }

    // Update medical record
    function updateMedicalRecord(string memory patientId, string memory newPrivateCID) 
        external 
    {
        require(patients[patientId].isRegistered, "Patient not registered");
        
        string memory doctorId = walletToDoctorId[msg.sender];
        require(bytes(doctorId).length > 0, "Doctor not found");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(doctors[doctorId].patientAccess[patientId], "No access to patient records");

        patients[patientId].privateCID = newPrivateCID;
        emit RecordUpdated(patientId, doctorId);
    }

    // Check if doctor has access to patient records
    function checkAccess(string memory patientId, string memory doctorId) 
        external 
        view 
        returns (bool) 
    {
        require(patients[patientId].isRegistered, "Patient not registered");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        return doctors[doctorId].patientAccess[patientId];
    }

    // View medical record
    function viewMedicalRecord(string memory patientId) 
        external 
        view 
        returns (string memory) 
    {
        require(patients[patientId].isRegistered, "Patient not registered");
        
        string memory doctorId = walletToDoctorId[msg.sender];
        require(bytes(doctorId).length > 0, "Doctor not found");
        require(doctors[doctorId].isRegistered, "Doctor not registered");
        require(doctors[doctorId].patientAccess[patientId], "No access to patient records");

        return patients[patientId].privateCID;
    }

    // Get doctor ID by wallet address
    function getDoctorId(address wallet) 
        external 
        view 
        returns (string memory) 
    {
        string memory doctorId = walletToDoctorId[wallet];
        require(bytes(doctorId).length > 0, "Doctor not found");
        return doctorId;
    }

    // Get patient ID by wallet address
    function getPatientId(address wallet) 
        external 
        view 
        returns (string memory) 
    {
        string memory patientId = walletToPatientId[wallet];
        require(bytes(patientId).length > 0, "Patient not found");
        return patientId;
    }

    // Check if a doctor is registered
    function isDoctorRegistered(string memory doctorId) 
        external 
        view 
        returns (bool) 
    {
        return doctors[doctorId].isRegistered;
    }

    // Check if a patient is registered
    function isPatientRegistered(string memory patientId) 
        external 
        view 
        returns (bool) 
    {
        return patients[patientId].isRegistered;
    }
}