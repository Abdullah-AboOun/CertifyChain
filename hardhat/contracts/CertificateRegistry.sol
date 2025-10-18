// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

/**
 * @title CertificateRegistry
 * @dev Smart contract for managing certificate issuance, verification, and revocation
 */
contract CertificateRegistry {
    
    // Struct to store certificate data
    struct Certificate {
        uint256 id;
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
    mapping(uint256 => Certificate) public certificates;
    mapping(address => IssuingEntity) public issuingEntities;
    mapping(address => bool) public isRegisteredEntity;
    mapping(address => uint256[]) public entityCertificates;
    
    // Events
    event EntityRegistered(address indexed entity, string name, uint256 timestamp);
    event EntityDeactivated(address indexed entity, uint256 timestamp);
    event CertificateIssued(
        uint256 indexed certificateId,
        address indexed issuer,
        string certificateHash,
        uint256 timestamp
    );
    event CertificateRevoked(uint256 indexed certificateId, address indexed issuer, uint256 timestamp);
    event FeeUpdated(string feeType, uint256 newFee);
    event FeesWithdrawn(address indexed owner, uint256 amount);
    
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
    
    modifier certificateExists(uint256 _certificateId) {
        require(_certificateId > 0 && _certificateId <= certificateCount, "Certificate does not exist");
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
     */
    function issueCertificate(
        string memory _certificateHash,
        string memory _metadata
    ) external payable onlyRegisteredEntity returns (uint256) {
        require(msg.value >= certificateIssuanceFee, "Insufficient issuance fee");
        require(bytes(_certificateHash).length > 0, "Certificate hash cannot be empty");
        
        certificateCount++;
        
        certificates[certificateCount] = Certificate({
            id: certificateCount,
            certificateHash: _certificateHash,
            issuer: msg.sender,
            issuedAt: block.timestamp,
            isRevoked: false,
            metadata: _metadata
        });
        
        entityCertificates[msg.sender].push(certificateCount);
        issuingEntities[msg.sender].certificateCount++;
        
        emit CertificateIssued(certificateCount, msg.sender, _certificateHash, block.timestamp);
        
        return certificateCount;
    }
    
    /**
     * @dev Revoke a certificate
     * @param _certificateId ID of the certificate to revoke
     */
    function revokeCertificate(uint256 _certificateId) 
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
    function verifyCertificate(uint256 _certificateId) 
        external 
        view 
        certificateExists(_certificateId) 
        returns (
            uint256 id,
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
     * @dev Get all certificates issued by an entity
     * @param _entity Address of the issuing entity
     * @return Array of certificate IDs
     */
    function getEntityCertificates(address _entity) external view returns (uint256[] memory) {
        return entityCertificates[_entity];
    }
    
    /**
     * @dev Get entity information
     * @param _entity Address of the entity
     * @return entityAddress Address of the entity
     * @return name Name of the entity
     * @return isActive Whether the entity is active
     * @return registeredAt Timestamp when registered
     * @return certCount Number of certificates issued
     */
    function getEntityInfo(address _entity) 
        external 
        view 
        returns (
            address entityAddress,
            string memory name,
            bool isActive,
            uint256 registeredAt,
            uint256 certCount
        ) 
    {
        IssuingEntity memory entity = issuingEntities[_entity];
        return (
            entity.entityAddress,
            entity.name,
            entity.isActive,
            entity.registeredAt,
            entity.certificateCount
        );
    }
    
    /**
     * @dev Deactivate an entity (only owner)
     * @param _entity Address of the entity to deactivate
     */
    function deactivateEntity(address _entity) external onlyOwner {
        require(isRegisteredEntity[_entity], "Entity not registered");
        issuingEntities[_entity].isActive = false;
        emit EntityDeactivated(_entity, block.timestamp);
    }
    
    /**
     * @dev Activate an entity (only owner)
     * @param _entity Address of the entity to activate
     */
    function activateEntity(address _entity) external onlyOwner {
        require(isRegisteredEntity[_entity], "Entity not registered");
        issuingEntities[_entity].isActive = true;
        emit EntityRegistered(_entity, issuingEntities[_entity].name, block.timestamp);
    }
    
    /**
     * @dev Update registration fee (only owner)
     * @param _newFee New registration fee
     */
    function updateRegistrationFee(uint256 _newFee) external onlyOwner {
        registrationFee = _newFee;
        emit FeeUpdated("registration", _newFee);
    }
    
    /**
     * @dev Update certificate issuance fee (only owner)
     * @param _newFee New issuance fee
     */
    function updateIssuanceFee(uint256 _newFee) external onlyOwner {
        certificateIssuanceFee = _newFee;
        emit FeeUpdated("issuance", _newFee);
    }
    
    /**
     * @dev Withdraw collected fees (only owner)
     */
    function withdrawFees() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        
        (bool success, ) = owner.call{value: balance}("");
        require(success, "Withdrawal failed");
        
        emit FeesWithdrawn(owner, balance);
    }
    
    /**
     * @dev Get contract balance
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
