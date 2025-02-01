// Club member database business logic.

const externalEncoding = 'latin1';

function isActiveStatus(status) {
    switch (status) {
        case 'Aktivmitglied':
        case 'Aktivmitglied (Ehepaar)':
        case "Junior 1":
        case "Junior 2":
        case "Junior 2 (>20)":
        case "Flüchtling":
        case "Gastmitglied":
        case "Ehrenmitglied":
            return true;
        default:
            return false;
    }
}

function shouldKeepExternal(row) {
    return isActiveStatus(row['Status']) && row['Lizenz'] != 'Lizenz in anderem Club';
}

// Mappings from club member database to Ophardt.

function externalToOphardt(row) {
    row['gender'] = row['gender'] == 'weiblich' ? 'F' : 'M';
    const nat = row['nationality1'];
    row['nationality1'] = Object.hasOwn(countryMapping, nat) ? countryMapping[nat] : nat;
    row['handed'] = row['handed'] == 'Links' ? 'L' : 'R';
}

const headerMapping = new Map([
    ['Vorname', 'firstname'],
    ['Nachname', 'lastname'],
    ['Geburtsdatum', 'dateofbirth'],
    ['Geschlecht', 'gender'],
    ['Nationalität', 'nationality1'],
    ['Waffenarm', 'handed'],
]);

const countryMapping = {
    'Schweiz': 'SUI',
    'Deutschland': 'GER',
    'Frankreich': 'FRA',
    'Italien': 'ITA',
    'Ungarn': 'HUN',
    'Österreich': 'AUT',
    'Niederlande': 'NED',
    'Großbritannien': 'GBR',
    'Polen': 'POL',
    'USA': 'USA',
    'Ukraine': 'UKR',
    'Spanien': 'ESP',
    'Griechenland': 'GRE',
    'Rumänien': 'ROU',
    'Kanada': 'CAN',
    'Estland': 'EST',
    'Russland': 'RUS',
    'China': 'CHN',
    'Schweden': 'SWE',
    'Slowakei': 'SVK',
    'Indien': 'IND',
    'Weißrussland': 'BLR',
    'Kroatien': 'CRO',
    'Hongkong': 'HKG',
    'Kirgisistan': 'KGZ',
    'Portugal': 'POR',
    'Tschechien': 'CZE',
    'Südafrika': 'RSA',
    'Litauen': 'LTU',
    'Finnland': 'FIN',
    'Luxemburg': 'LUX',
    'Norwegen': 'NOR',
    'Singapur': 'SGP',
    'Irland': 'IRL',
    'Irak': 'IRQ',
    'Libanon': 'LBN',
    'Süd Korea': 'KOR'
}

// Ophardt business logic.

const ophardtEncoding = "utf-16";

const ophardtColumns = [
    'firstname',
    'lastname',
    'dateofbirth',
    'gender',
    'nationality1',
    'handed',
];

function shouldKeepOphardt(row) {
    return row['active'] == 1;
}

function getKey(row) {
    key = row['lastname'] + row['firstname'] + row['dateofbirth'];
    return key.charAt(0).toUpperCase() + key.slice(1);
}

// No business logic below this point.

function parseExternalHeaders(file) {
    return new Promise((resolve) => {
        Papa.parse(
            file,
            {
                preview: 1,
                encoding: externalEncoding,
                complete: (results) => { resolve(results.data[0]) }
            }
        );
    })
}

function parseExternal(file) {
    return new Promise((resolve) => {
        Papa.parse(
            file,
            {
                header: true,
                transformHeader: (header) =>
                    headerMapping.has(header) ? headerMapping.get(header) : header,
                encoding: externalEncoding,
                complete: (results) => { resolve(results.data) }
            }
        );
    })
}

function parseExisting(file) {
    return new Promise((resolve) => {
        Papa.parse(
            file,
            {
                header: true,
                encoding: ophardtEncoding,
                complete: (results) => { resolve(results.data) }
            }
        );
    })
}

const externalInput = document.getElementById('external');
externalInput.addEventListener("input", processExternalHeaders);
const externalMap = new Map();

async function processExternalHeaders() {
    const externalFile = externalInput.files[0];
    const externalHeaders = await parseExternalHeaders(externalFile);
    const columnsPresent = new Array();
    const unmatchedHeaders = new Array();
    externalHeaders.forEach(header => {
        if (ophardtColumns.includes(header)) {
            columnsPresent.push(header);
        } else if (headerMapping.has(header)) {
            columnsPresent.push(headerMapping.get(header));
        } else {
            unmatchedHeaders.push(header);
        }
    });
    if (columnsPresent.length < ophardtColumns.length) {
        const missingHeaders = ophardtColumns.filter(header => !columnsPresent.includes(header));
        document.getElementById('stats-external').innerHTML = `
            <p>The following columns were not found in the club members file: ${missingHeaders}</p>
            <p>The following columns from the club members file were unmatched: ${unmatchedHeaders}</p>
        `;
    } else {
        processExternalContent();
    }
}

async function processExternalContent() {
    const externalFile = externalInput.files[0];
    const externalData = await parseExternal(externalFile);
    externalData.forEach(row => {
        if (shouldKeepExternal(row)) {
            externalMap.set(getKey(row), row);
        }
    });
    document.getElementById('stats-external').innerHTML = `
        <p>Entries in club members file: ${externalData.length} Retained: ${externalMap.size}</p>
    `;

    document.getElementById('existing-div').removeAttribute('hidden');
}

const existingInput = document.getElementById('existing');
existingInput.addEventListener("input", processExisting);
const existingMap = new Map();

async function processExisting() {
    const existingFile = existingInput.files[0];
    const existingData = await parseExisting(existingFile);

    existingData.forEach(row => {
        if (shouldKeepOphardt(row)) {
            existingMap.set(getKey(row), row);
        }
    });
    document.getElementById('stats-existing').innerHTML = `
        <p>Entries in ophardt athletes file: ${existingData.length} Retained: ${existingMap.size}</p>
    `;

    compareFiles();
}

function compareFiles() {
    const unmatchedExternalDiv = document.getElementById('unmatched-external');
    const unmatchedExistingDiv = document.getElementById('unmatched-existing');

    // Find unmatched entries
    const unmatchedExternalEntries =
        externalMap.values().filter(row => !existingMap.has(getKey(row))).toArray();
    unmatchedExternalEntries.forEach(row => externalToOphardt(row));
    const unmatchedExistingEntries =
        existingMap.values().filter(row => !externalMap.has(getKey(row))).toArray();

    unmatchedExternalDiv.innerHTML = '<h3>Unmatched Club Member Entries:</h3>';
    outputUnmatched(unmatchedExternalEntries, unmatchedExternalDiv);
    unmatchedExistingDiv.innerHTML = '<h3>Unmatched Ophardt Entries:</h3>';
    outputUnmatched(unmatchedExistingEntries, unmatchedExistingDiv);
}

function outputUnmatched(unmatchedEntries, outputDIV) {
    if (unmatchedEntries.length > 0) {
        const csvContent = Papa.unparse(
            unmatchedEntries,
            { delimiter: ';', columns: ophardtColumns }
        );
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        
        outputDIV.innerHTML += `<pre>${csvContent}</pre>`;
        outputDIV.innerHTML += `
            <a href="${url}" download="unmatched_entries.csv" 
                class="download-link">Download unmatched entries CSV</a>
        `;
    } else {
        outputDIV.innerHTML += '<p>No unmatched entries found.</p>';
    }
}