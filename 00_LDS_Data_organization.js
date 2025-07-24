// ==========================================================================================================
//            CONFIGURE THESE TWO CONSTANTS
// ==========================================================================================================

// “File responses” folder ID (source of all uploads)
const SOURCE_FOLDER_ID = '1IegZt_1uK1q5MPbQtxOKlKLJABxSxGHHOsN-Eg7GRlZ7AYPVuUDSKXrDMIKUibQCH4q3FQQ4';

// Target DATA folder ID in our Shared Drive
const TARGET_FOLDER_ID = '1vZv0J5JWgljXSqPejXCmnSpVikQUDdmL';

// ==========================================================================================================
// addOrCopyIntoSharedDrive: moving files within our Evaluasi Shared Drive folders
// ==========================================================================================================
function addOrCopyIntoSharedDrive(fileId, folderId) {
  try {
    // Attempting to add the existing file (by its ID) as a child of the target folder
    Drive.Files.update(
      {},               // {} no changes to the file’s metadata
      fileId,           // the ID of the file we want to update
      null,             // not changing the file’s content
      { 
        addParents: folderId,      // add this folder ID as an additional parent
        supportsAllDrives: true  
      }
    );
    // Making sure everything is working: Logging success to the execution transcript
    console.log(`Added parent ${folderId} to file ${fileId}`);
  
  } catch (err) {
    // Making sure everything is working: Extracting the HTTP error code
    const code = err.code || (err.details && err.details.code);

    if (code === 403) {
      Drive.Files.copy(
        {}, 
        fileId, 
        { 
          parents: [folderId],      // Placing the new copy in the target folder
          supportsAllDrives: true   // Ensuring it works on Shared Drives
        }
      );
      console.warn(`Copied file ${fileId} into Shared Drive folder ${folderId} (403 fallback).`);
    } else {
      // If it’s any other error, re‐throw so you can see the full stack
      throw err;
    }
  }
}


// ==========================================================================================================
// Backfill of all historical files
// ==========================================================================================================
function copyExistingUploads() {
  // Getting the “File responses” folder as a DriveApp Folder object
  const source = DriveApp.getFolderById(SOURCE_FOLDER_ID);

  // Retrieving an iterator over all files in that folder
  const files  = source.getFiles();

  // Countering to track how many files we process
  let count = 0;

  // Looping through every file in the folder
  while (files.hasNext()) {
    const f = files.next();              // getting the next file
    addOrCopyIntoSharedDrive(            // addding or copy it into DATA
      f.getId(),                         //   passing the file’s ID
      TARGET_FOLDER_ID                   //   passing the DATA folder ID
    );
    count++;                             // incrementing our counter
  }

  // Logging the total number processed
  Logger.log(`Processed ${count} existing files.`);
}



// ==========================================================================================================
// Triggering to handle future form uploads automatically
// ==========================================================================================================
function onFormSubmit(e) {
  // The exact text of our file-upload question in the form
  const UPLOAD_Q = 'Please upload a single zipped folder with ALL of the data for this project…';

  // e.namedValues maps question titles and array of responses (we want the first)
  const raw = e.namedValues[UPLOAD_Q];

  // If no response or empty string, bail early
  if (!raw || !raw[0]) {
    console.warn('No files found in response for:', UPLOAD_Q);
    return;
  }

  // Splitting the comma-separated list of file IDs, then processing each
  raw[0]
    .split(/\s*,\s*/)                   // splitting on commas, trimming whitespace
    .forEach(id => {                    // for each individual file ID…
      addOrCopyIntoSharedDrive(         // …adding or copy it into DATA
        id, 
        TARGET_FOLDER_ID
      );
    });
}
