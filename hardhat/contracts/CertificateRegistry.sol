// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CertificateRegistry
 * @dev Smart contract for managing certificate issuance, verification, and revocation
 */
contract CertificateRegistry {
    
    // Struct to store certificate data
    struct Certificate {
        bytes32 id;
        string certificateHash; // IPFS hash or document hash
        address issuer;
        uint256 issuedAt;
        bool isRevoked;
        string metadata; // Additional metadata (JSON string)
    }
    
    // Struct to store issuing entity data
    struct IssuingEntity {
        address entityAddress;
        string name;
        bool isActive;
        uint256 registeredAt;
        uint256 certificateCount;
    }
    
    // State variables
    address public owner;
    uint256 public registrationFee;
    uint256 public certificateIssuanceFee;
    uint256 public certificateCount;
    
    // Mappings
    mapping(bytes32 => Certificate) public certificates;
    mapping(string => bytes32) public certificateHashToId; // Map hash to ID for lookup
    mapping(address => IssuingEntity) public issuingEntities;
    mapping(address => bool) public isRegisteredEntity;
    mapping(address => bytes32[]) public entityCertificates;
    
    // Events
    event EntityRegistered(address indexed entity, string name, uint256 timestamp);
    event CertificateIssued(
        bytes32 indexed certificateId,
        address indexed issuer,
        string certificateHash,
        uint256 timestamp
    );
    event CertificateRevoked(bytes32 indexed certificateId, address indexed issuer, uint256 timestamp);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can call this function");
        _;
    }
    
    modifier onlyRegisteredEntity() {
        require(isRegisteredEntity[msg.sender], "Not a registered entity");
        require(issuingEntities[msg.sender].isActive, "Entity is deactivated");
        _;
    }
    
    modifier certificateExists(bytes32 _certificateId) {
        require(certificates[_certificateId].issuer != address(0), "Certificate does not exist");
        _;
    }
    
    // Constructor
    constructor(uint256 _registrationFee, uint256 _certificateIssuanceFee) {
        owner = msg.sender;
        registrationFee = _registrationFee;
        certificateIssuanceFee = _certificateIssuanceFee;
        certificateCount = 0;
    }
    
    /**
     * @dev Register a new issuing entity
     * @param _name Name of the issuing entity
     */
    function registerEntity(string memory _name) external payable {
        require(!isRegisteredEntity[msg.sender], "Entity already registered");
        require(msg.value >= registrationFee, "Insufficient registration fee");
        require(bytes(_name).length > 0, "Name cannot be empty");
        
        issuingEntities[msg.sender] = IssuingEntity({
            entityAddress: msg.sender,
            name: _name,
            isActive: true,
            registeredAt: block.timestamp,
            certificateCount: 0
        });
        
        isRegisteredEntity[msg.sender] = true;
        
        emit EntityRegistered(msg.sender, _name, block.timestamp);
    }
    
    /**
     * @dev Issue a new certificate
     * @param _certificateHash Hash of the certificate document
     * @param _metadata Additional metadata
     * @return certificateId The generated certificate ID
     */
    function issueCertificate(
        string memory _certificateHash,
        string memory _metadata
    ) external payable onlyRegisteredEntity returns (bytes32) {
        require(msg.value >= certificateIssuanceFee, "Insufficient issuance fee");
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");
        require(certificateHashToId[_certificateHash] == bytes32(0), "Certificate hash already used");
        
        // Generate unique certificate ID from hash, issuer, and timestamp
        bytes32 certificateId = keccak256(abi.encodePacked(_certificateHash, msg.sender, block.timestamp, certificateCount));
        
        certificateCount++;
        
        certificates[certificateId] = Certificate({
            id: certificateId,
            certificateHash: _certificateHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            isRevoked: false,
            metadata: _metadata
        });
        
        certificateHashToId[_certificateHash] = certificateId;
        entityCertificates[msg.sender].push(certificateId);
        issuingEntities[msg.sender].certificateCount++;
        
        emit CertificateIssued(certificateId, msg.sender, _certificateHash, block.timestamp);
        
        return certificateId;
    }
    
    /**
     * @dev Revoke a certificate
     * @param _certificateId ID of the certificate to revoke
     */
    function revokeCertificate(bytes32 _certificateId) 
        external 
        onlyRegisteredEntity 
        certificateExists(_certificateId) 
    {
        Certificate storage cert = certificates[_certificateId];
        require(cert.issuer == msg.sender, "Only issuer can revoke");
        require(!cert.isRevoked, "Certificate already revoked");
        
        cert.isRevoked = true;
        
        emit CertificateRevoked(_certificateId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Verify a certificate
     * @param _certificateId ID of the certificate
     * @return id Certificate ID
     * @return certificateHash Hash of the certificate
     * @return issuer Address of the issuer
     * @return issuedAt Timestamp when issued
     * @return isRevoked Whether the certificate is revoked
     * @return metadata Additional metadata
     * @return issuerName Name of the issuing entity
     */
    function verifyCertificate(bytes32 _certificateId) 
        external 
        view 
        certificateExists(_certificateId) 
        returns (
            bytes32 id,
            string memory certificateHash,
            address issuer,
            uint256 issuedAt,
            bool isRevoked,
            string memory metadata,
            string memory issuerName
        ) 
    {
        Certificate memory cert = certificates[_certificateId];
        IssuingEntity memory entity = issuingEntities[cert.issuer];
        
        return (
            cert.id,
            cert.certificateHash,
            cert.issuer,
            cert.issuedAt,
            cert.isRevoked,
            cert.metadata,
            entity.name
        );
    }
    
    /**
     * @dev Get certificate ID by certificate hash
     * @param _certificateHash The certificate hash
     * @return Certificate ID
     */
    function getCertificateIdByHash(string memory _certificateHash) 
        external 
        view 
        returns (bytes32) 
    {
        return certificateHashToId[_certificateHash];
    }
    
    /**
     * @dev Get all certificates issued by an entity
     * @param _entity Address of the issuing entity
     * @return Array of certificate IDs
     */
    function getEntityCertificates(address _entity) external view returns (bytes32[] memory) {
        return entityCertificates[_entity];
    }
    
    

}
