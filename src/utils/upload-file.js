import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const ACCESS_KEY = import.meta.env.VITE_ACCESS_KEY;
const DIRECTORY_NAME = import.meta.env.VITE_DIRECTORY_NAME
const REGION = import.meta.env.VITE_REGION
const S3_BUCKET = import.meta.env.VITE_S3_BUCKET
const SECRET_ACCES_KEY = import.meta.env.VITE_SECRET_ACCES_KEY
//const FTP_UPLOAD_URL = import.meta.env.VITE_FTP_UPLOAD_URL;
const FTP_UPLOAD_URL = "https://file.angeboutchoue.com/api/esc/uploadfile"


// Configure the S3 client
const s3Client = new S3Client({
    region: REGION,
    credentials: {
        accessKeyId: ACCESS_KEY,
        secretAccessKey: SECRET_ACCES_KEY,
    },
});

/**
 * Upload single or multiple files to S3
 * @param {File|File[]} files - Single file or array of files to upload
 * @returns {Promise<Object>} - Returns object with success status and data
 */
export const uploadToS3 = async (files) => {
    // Handle single file upload
    if (!Array.isArray(files)) {
        try {
            // Ensure the file is a valid File object
            if (!(files instanceof File)) {
                return {
                    success: false,
                    message: 'Le paramètre doit être un objet File valide'
                };
            }

            // Use FileReader to get file data as ArrayBuffer
            const fileData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(files);
            });

            const command = new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: `${DIRECTORY_NAME}/${files.name}`,
                Body: fileData,
                ContentType: files.type,
            });

            await s3Client.send(command);
            const fileUrl = `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${DIRECTORY_NAME}/${files.name}`;
            
            return {
                success: true,
                message: 'Fichier uploadé avec succès',
                dataUrl: fileUrl,
            };
        } catch (error) {
            console.error('Error uploading file:', error);
            return {
                success: false,
                message: error.message || 'Erreur lors de l\'upload du fichier vers S3'
            };
        }
    }


    // Handle multiple files upload
    try {
        const uploadPromises = files.map(async (file) => {
            // // Ensure the file is a valid File object
            // if (!(file instanceof File)) {
            //     throw new Error('Invalid file object');
            // }

            // Use FileReader to get file data as ArrayBuffer
            const fileData = await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result);
                reader.onerror = reject;
                reader.readAsArrayBuffer(file);
            });

            const command = new PutObjectCommand({
                Bucket: S3_BUCKET,
                Key: `${DIRECTORY_NAME}/${file.name}`,
                Body: fileData,
                ContentType: file.type, // Important: ajouter le type de contenu
            });

            const data = await s3Client.send(command);
            return `https://${S3_BUCKET}.s3.${REGION}.amazonaws.com/${DIRECTORY_NAME}/${file.name}`;
        });

        const locations = await Promise.all(uploadPromises);
        return {
            success: true,
            message: 'Fichiers uploadés avec succès',
            dataUrl: locations
        };
    } catch (error) {
        console.error('Error uploading files:', error);
        return {
            success: false,
            message: error.message || 'Erreur lors de l\'upload des fichiers vers S3'
        };
    }
};

/**
 * Upload un fichier via FTP en utilisant une requête POST avec FormData
 * @param {File} file - Fichier à uploader
 * @returns {Promise<Object>} - Retourne la réponse de l'API
 */
export const uploadFromFtp = async (file) => {
    // Vérification que le paramètre est bien un File
    if (!(file instanceof File)) {
        return {
            success: false,
            message: 'Le paramètre doit être un objet File'
        };
    }

    // Vérification de la taille du fichier (3MB maximum)
    const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB en bytes
    if (file.size > MAX_FILE_SIZE) {
        return {
            success: false,
            message: `Le fichier est trop volumineux. Taille maximale autorisée : 3MB (taille actuelle : ${(file.size / (1024 * 1024)).toFixed(2)}MB)`
        };
    }

    
    // Vérification que l'URL est définie
    if (!FTP_UPLOAD_URL) {
        return {
            success: false,
            message: 'URL d\'upload FTP non configurée (VITE_FTP_UPLOAD_URL manquant)'
        };
    }

    // Création du FormData
    const formData = new FormData();
    formData.append('file', file);
    
    try {
        const response = await fetch(FTP_UPLOAD_URL, {
            method: 'POST',
            // Ne pas définir Content-Type manuellement, le navigateur le fait automatiquement avec le boundary
            body: formData
        });

        // Vérification de la réponse
        if (!response.ok) {
            console.error('Erreur lors de l\'upload FTP:', response.status, response.statusText);
            return {
                success: false,
                message: `Erreur HTTP ${response.status}: ${response.statusText || 'Erreur lors de l\'upload'}`
            };
        }

        // Tentative de parsing JSON avec gestion d'erreur
        let data;
        try {
            data = await response.json();
        } catch (jsonError) {
            console.error('Erreur lors du parsing JSON:', jsonError);
            return {
                success: false,
                message: 'Réponse invalide du serveur (format JSON attendu)'
            };
        }

        if (data.status === 200) {
            console.log('Upload FTP réussi:', data.filedestination);
            return {
                success: true,
                message: 'Upload réussi',
                dataUrl: data.filedestination
            };
        } else {
            console.error('Erreur lors de l\'upload FTP:', data.message);
            return {
                success: false,
                message: data.message || 'Erreur lors de l\'upload FTP'
            };
        }
    } catch (error) {
        console.error('Erreur lors de l\'upload FTP:', error);
        return {
            success: false,
            message: error.message || 'Erreur lors de l\'upload FTP'
        };
    }
};

