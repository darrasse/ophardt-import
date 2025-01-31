const headerMapping = {
    'Vorname': 'firstname',
    'Nachname': 'lastname',
    'Geburtsdatum': 'dateofbirth',
    'Geschlecht': 'gender',
    'Nationalität': 'nationality1',
    'Waffenarm': "handed"
}

const ophardtColumns = [
    'firstname',
    'lastname',
    'dateofbirth',
    'gender',
    'nationality1',
    'handed'
];

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

function isActiveStatus(status) {
    switch (status) {
        case 'Aktivmitglied':
        case 'Aktivmitglied (Ehepaar)':
        case "Junior 1":
        case "Junior 2":
        case "Junior 2 (>20)":
            return true;
        default:
            return false;
    }
}

function getKey(row) {
    key = row['lastname'] + row['firstname'] + row['dateofbirth'];
    return key.charAt(0).toUpperCase() + key.slice(1);
}

function parseExternal(file) {
    return new Promise((resolve) => {
        Papa.parse(
            file,
            {
                header: true,
                transformHeader: (header) =>
                    Object.hasOwn(headerMapping, header) ? headerMapping[header] : header,
                encoding: 'latin1',
                complete: (results) => { resolve(results) }
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
                encoding: 'utf-16',
                complete: (results) => { resolve(results) }
            }
        );
    })
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
        outputDIV.innerHTML = '<p>No unmatched entries found.</p>';
    }
}

const externalInput = document.getElementById('external');
const existingInput = document.getElementById('existing');

externalInput.addEventListener("input", processExternal);
existingInput.addEventListener("input", compareFiles);

let externalData = undefined;
let externalMap = new Map();

async function processExternal() {
    const externalFile = externalInput.files[0];
    externalData = await parseExternal(externalFile);
    externalData.data.forEach(row => {
        externalMap.set(getKey(row), row);
    });

    document.getElementById('existing-div').removeAttribute('hidden');
}

async function compareFiles() {
    const existingFile = existingInput.files[0];
    const statisticsDiv = document.getElementById('statistics');
    const results1Div = document.getElementById('results1');
    const results2Div = document.getElementById('results2');

    try {
        const existingData = await parseExisting(existingFile);

        const existingMap = new Map();
        existingData.data.forEach(row => {
            existingMap.set(getKey(row), row);
        });

        // Find unmatched entries
        const unmatchedExternalEntries = externalData.data.filter(row => 
            isActiveStatus(row['Status']) && row['Lizenz'] != 'Lizenz in anderem Club' && !existingMap.has(getKey(row))
        );
        unmatchedExternalEntries.forEach(row => {
            row['gender'] = row['gender'] == 'weiblich' ? 'F' : 'M';
            const nat = row['nationality1'];
            row['nationality1'] = Object.hasOwn(countryMapping, nat) ? countryMapping[nat] : nat;
            row['handed'] = row['handed'] == 'Links' ? 'L' : 'R';
        })
        const unmatchedExistingEntries = existingData.data.filter(row => 
            row['active'] == 1 && !externalMap.has(getKey(row))
        );

        // Display statistics
        statisticsDiv.innerHTML = `
            <h3>Results:</h3>
            <p>Entries in club members file: ${externalData.data.length}</p>
            <p>Entries in ophardt file: ${existingData.data.length}</p>
        `;

        results1Div.innerHTML = '<h3>Unmatched Club Member Entries:</h3>';
        outputUnmatched(unmatchedExternalEntries, results1Div);
        results2Div.innerHTML = '<h3>Unmatched Ophardt Entries:</h3>';
        outputUnmatched(unmatchedExistingEntries, results2Div);

    } catch (error) {
        results1Div.innerHTML = `<p style="color: red">Error: ${error.message}</p>`;
    }
}