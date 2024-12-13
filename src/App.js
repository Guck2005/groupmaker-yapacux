import React, { useState } from 'react';
import 'flowbite';
import 'flowbite-react';
import { Button, TextInput, Label, Card, Table, Navbar, Footer } from 'flowbite-react';
import { FileInput } from 'flowbite-react';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

function App() {
  const [students, setStudents] = useState([]);
  const [numberOfGroups, setNumberOfGroups] = useState(0);
  const [studentList, setStudentList] = useState([]);
  const [groups, setGroups] = useState([]);
  const [fileName, setFileName] = useState('Aucun fichier sélectionné');
  const [fileProgress, setFileProgress] = useState(0);
  const [groupType, setGroupType] = useState('mixed');
  const [totalGirls, setTotalGirls] = useState(0);
  const [totalBoys, setTotalBoys] = useState(0);
  const [fileUploaded, setFileUploaded] = useState(false);

  const handleChangeGroups = (event) => {
    setNumberOfGroups(event.target.value);
  };

  const resetState = () => {
    setStudents([]);
    setNumberOfGroups(0);
    setStudentList([]);
    setGroups([]);
    setFileName('Aucun fichier sélectionné');
    setFileProgress(0);
    setGroupType('mixed');
    setTotalGirls(0);
    setTotalBoys(0);
    setFileUploaded(false);
  };

  const handleGroupTypeChange = (event) => {
    setGroupType(event.target.value);
  };

  const shuffleArray = (array) => {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  };

  const createGroups = (students, numberOfGroups, groupType) => {
    let filteredStudents = students;

    if (groupType === 'boys') {
      filteredStudents = students.filter(student => student.gender === 'M');
    } else if (groupType === 'girls') {
      filteredStudents = students.filter(student => student.gender === 'F');
    } else if (groupType === 'mixed') {
      const girls = students.filter(student => student.gender === 'F');
      const boys = students.filter(student => student.gender === 'M');

      // Initialisation des groupes vides
      const groups = Array.from({ length: numberOfGroups }, () => []);

      const addStudentsToGroups = (students) => {
        let groupIndex = 0;
        while (students.length > 0) {
          groups[groupIndex].push(students.pop());
          groupIndex = (groupIndex + 1) % numberOfGroups;
        }
      };

      // Mélanger les étudiants pour une répartition aléatoire
      const shuffledGirls = shuffleArray([...girls]);
      const shuffledBoys = shuffleArray([...boys]);

      // Ajouter les filles de manière égale dans les groupes
      addStudentsToGroups(shuffledGirls);

      // Ajouter les garçons de manière égale dans les groupes
      addStudentsToGroups(shuffledBoys);

      return groups;
    }

    const shuffledStudents = shuffleArray([...filteredStudents]);
    const groups = [];
    const groupSize = Math.floor(filteredStudents.length / numberOfGroups);
    const remainder = filteredStudents.length % numberOfGroups;

    let startIndex = 0;
    for (let i = 0; i < numberOfGroups; i++) {
      const endIndex = startIndex + groupSize + (i < remainder ? 1 : 0);
      groups.push(shuffledStudents.slice(startIndex, endIndex));
      startIndex = endIndex;
    }

    return groups;
  };

  const generateGroups = () => {
    if (numberOfGroups <= 0) {
      alert('Veuillez entrer un nombre valide de groupes.');
      return;
    }
    if (studentList.length === 0) {
      alert('Veuillez télécharger un fichier avant de générer les groupes.');
      return;
    }

    const generatedGroups = createGroups(studentList, numberOfGroups, groupType);
    setGroups(generatedGroups);
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    alert(`Formulaire soumis avec ${numberOfGroups} groupes et les étudiants : ${studentList.map(s => s.name).join(', ')}`);
  };

  const exportToExcel = (groups) => {
    const ws = XLSX.utils.json_to_sheet(groups.flat().map((student, index) => ({ No: index + 1, Name: student.name })));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Groups");
    XLSX.writeFile(wb, "groups.xlsx");
  };

  const exportToPDF = (groups) => {
    const doc = new jsPDF();
    const content = document.getElementById('pdf-content');

    html2canvas(content).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const imgWidth = doc.internal.pageSize.getWidth();
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      doc.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      doc.save('groups.pdf');
    });
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const validExtensions = ['xls', 'xlsx'];
    const fileExtension = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(fileExtension)) {
      alert('Erreur : Veuillez télécharger un fichier Excel au format .xls ou .xlsx.');
      return;
    }

    setFileName(file.name);
    setFileProgress(0);
    setFileUploaded(true); // Le fichier est téléversé

    const reader = new FileReader();
    reader.onloadstart = () => setFileProgress(10);
    reader.onprogress = (e) => setFileProgress((e.loaded / e.total) * 100);
    reader.onloadend = () => {
      setFileProgress(100);
      const data = new Uint8Array(reader.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const json = XLSX.utils.sheet_to_json(sheet);

      if (!json[0] || !('Nom' in json[0]) || !('Genre' in json[0])) {
        alert("Erreur : Le fichier doit contenir une colonne 'Nom' et une colonne 'Genre'.");
        setFileUploaded(false); // Réinitialiser si le fichier est incorrect
        return;
      }

      const students = json.map(row => ({ name: row['Nom'], gender: row['Genre'] }));
      setStudentList(students);
      setTotalGirls(students.filter(student => student.gender === 'F').length);
      setTotalBoys(students.filter(student => student.gender === 'M').length);
    };

    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="App flex flex-col min-h-screen p-8">
      {/* Navbar */}
      <Navbar fluid={true} rounded={true} className="mb-8 bg-blue-500">
        <div className="flex justify-between w-full items-center">
          <Navbar.Brand href="/">
            <span className="self-center whitespace-nowrap text-xl font-semibold text-white">
              GroupMaker
            </span>
          </Navbar.Brand>
          <a
  href="#"
  className="text-white font-medium ml-4 hover:underline text-xs sm:text-base"
>
  Comment l'utiliser ?
</a>

        </div>
        
      </Navbar>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4 ">
        <div className="mb-8 w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4">
            {/* Nombre de groupes et type de groupe */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
              {/* Input for number of groups */}
              <div className="flex flex-col sm:flex-row items-center mb-4 sm:mr-8">
                <Label htmlFor="numberOfGroups" className="whitespace-nowrap mb-2 sm:mb-0 sm:mr-4">
                  Nombre de groupes :
                </Label>
                <input
                  id="numberOfGroups"
                  type="number"
                  value={numberOfGroups}
                  onChange={handleChangeGroups}
                  required
                  className="bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-700 appearance-none"
                />
              </div>


              {/* Select for group type */}
              <div className="flex flex-col sm:flex-row items-center mb-4">
                <Label htmlFor="groupType" className="whitespace-nowrap mb-2 sm:mb-0 sm:mr-4">
                  Type de groupe :
                </Label>
                <select
                  id="groupType"
                  value={groupType}
                  onChange={handleGroupTypeChange}
                  className="bg-gray-100 border border-gray-300 rounded-md py-2 px-3 text-gray-700 appearance-none"
                >
                  <option value="mixed">Mixte</option>
                  <option value="boys">Garçons uniquement</option>
                  <option value="girls">Filles uniquement</option>
                </select>
              </div>

            </div>

            {/* Totaux */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4">
              <p className="bg-pink-200 text-pink-900 py-1 px-3 rounded-md font-semibold mb-2 sm:mb-0">
                Filles : {totalGirls}
              </p>
              <p className="bg-blue-200 text-blue-900 py-1 px-3 rounded-md font-semibold mb-2 sm:mb-0">
                Garçons : {totalBoys}
              </p>
              <p className="bg-yellow-200 text-yellow-900 py-1 px-3 rounded-md font-semibold mb-2 sm:mb-0">
                Total : {studentList.length}
              </p>
            </div>

          </div>
        </div>

        {/* File Upload */}
        {!fileUploaded ? (
          <div className="flex w-full items-center justify-center mb-8">
            <Label
              htmlFor="dropzone-file"
              className="flex h-64 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-600"
            >
              <div className="flex flex-col items-center justify-center pb-6 pt-5">
                <svg
                  className="mb-4 h-8 w-8 text-gray-500 dark:text-gray-400"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 20 16"
                >
                  <path
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
                  />
                </svg>
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                  <span className="font-semibold">Cliquez pour téléverser</span> ou glissez et déposez
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Fichier Excel (MAX. 100Mo)</p>
              </div>
              <FileInput id="dropzone-file" className="hidden" onChange={handleFileChange} />
            </Label>
          </div>
        ) : (
          <div className="flex justify-center space-x-4 mt-4">
            <Button onClick={resetState} className="bg-gray-500 text-white hover:bg-gray-600 px-4 py-2 rounded-md shadow-md">
              Importer un autre fichier
            </Button>
          </div>
        )}

        <div className="relative w-full">
          <div className="absolute top-0 left-0 w-full bg-blue-500 h-1" style={{ width: `${fileProgress}%` }}></div>
          <Label className="w-full text-center mt-2">{fileName}</Label>
        </div>

        <div className="flex justify-center space-x-4">
          <Button onClick={generateGroups} className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md shadow-md">Générer les groupes</Button>
          <Button onClick={() => exportToPDF(groups)} className="bg-blue-500 text-white hover:bg-blue-600 px-4 py-2 rounded-md shadow-md">Exporter en PDF</Button>
        </div>
      </form>

      {/* Groups Display */}
      {groups.length > 0 && (
        <h1 className="text-2xl font-bold text-center mt-8">
          Yapacux, vos groupes sont prêts 😎✌️
        </h1>
      )}

      <div id="pdf-content">
        {groups.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            {groups.map((group, index) => (
              <Card key={index} className="p-4 border border-gray-200 rounded-md shadow-sm">
                <h3 className="text-lg font-semibold mb-2">Groupe {index + 1}</h3>
                <ul className="list-disc ml-5">
                  {group.map((student, i) => (
                    <li key={i}>{student.name}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Footer container={true} className="mt-auto text-center justify-center">
        <Footer.Copyright
          href="#"
          by="GroupMaker™ | Par Kouadio Christday"
          year={2024}
        />
      </Footer>
    </div>
  );
}

export default App;
