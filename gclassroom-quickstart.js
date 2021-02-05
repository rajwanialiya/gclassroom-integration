const fs = require('fs');
const readline = require('readline');
const {google} = require('googleapis');

const SCOPES = [
  'https://www.googleapis.com/auth/classroom.courses.readonly', 
  'https://www.googleapis.com/auth/classroom.topics.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.me.readonly',
  'https://www.googleapis.com/auth/classroom.coursework.students.readonly',
];
// created automatically when the authorization flow completes for the first
const TOKEN_PATH = 'token.json';

// Load client secrets from a local file.
function read() {
  fs.readFile('credentials.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    google.options({auth: authorize(JSON.parse(content))});
    // authorize(JSON.parse(content), listCourses);
    // authorize(JSON.parse(content), listTopics);
    // authorize(JSON.parse(content), listCourseWorkByTopicId);
  });
}

// Create an OAuth2 client with the given credentials, and then execute callback function
function authorize(credentials) {
  const {client_secret, client_id, redirect_uris} = credentials.installed;
  const oAuth2Client = new google.auth.OAuth2(
      client_id, client_secret, redirect_uris[0]);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, (err, token) => {
    if (err) return getNewToken(oAuth2Client);
    oAuth2Client.setCredentials(JSON.parse(token));
    return oAuth2Client;
  });
}

// Get new token after prompting for user auth, execute the callback with the authorized OAuth2 client
function getNewToken(oAuth2Client) {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });
  console.log('Authorize this app by visiting this url:', authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question('Enter the code from that page here: ', (code) => {
    rl.close();
    oAuth2Client.getToken(code, (err, token) => {
      if (err) return console.error('Error retrieving access token', err);
      oAuth2Client.setCredentials(token);
      // Store the token to disk for later program executions
      fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
        if (err) return console.error(err);
        console.log('Token stored to', TOKEN_PATH);
      });
    });
  });
}

// CALLBACKS 

const coursesList = [];
//List first 10 courses
function listCourses(auth) {
  const classroom = google.classroom({version: 'v1', auth});
  classroom.courses.list({
    pageSize: 10,
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    const courses = res.data.courses;
    if (courses && courses.length) {
      console.log('Courses:');
      courses.forEach((course) => {
        coursesList.push({name: course.name, id: course.id});
      });
      console.log(coursesList)
      console.log('\n')
      return coursesList;
    } else {
      console.log('No courses found.');
    }
  });
}

const topicList = [];
const courseId = '266571008591';

// list topics for each course
function listTopics(auth) {
  const classroom = google.classroom({version: 'v1', auth});
  classroom.courses.topics.list({
    courseId: courseId
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    const topics = res.data.topic;
    if (topics && topics.length) {
      console.log('Topics:');
      topics.forEach((topic) => {
        topicList.push({name: topic.name, id: topic.topicId});
      });
      console.log(topicList)
      console.log('\n')
    } else {
      console.log('No topics found.');
    }
  });
}

const courseWorkList = [];
const topicId = '266571008591';

// retrieve info about assignments, tests, 
function listCourseWorkByTopicId() {
  const classroom = google.classroom({version: 'v1'});
  classroom.courses.courseWork.list({
    courseId: courseId,
  }, (err, res) => {
    if (err) return console.error('The API returned an error: ' + err);
    const courseWork = res.data.courseWork;
    if (courseWork && courseWork.length) {
      console.log(`Coursework for topic ${topicId}:`);
      courseWork.forEach((object) => {
        if (Object.keys(object).find(key => object[key] === topicId)) {
          const courseWorkMaterials = {};

          if (object.materials && object.materials.length) {
            object.materials.forEach((materialObject) => {
              let materialType = Object.keys(materialObject)[0];
              let materialInfo = Object.values(materialObject)[0];
              let link = '';

              Object.entries(materialInfo).forEach(info => {
                [key, value] = info;
                if (key === 'alternateLink' || key === 'url' || key === 'formUrl') {
                  link = value;
                } else if (key === 'driveFile') {
                  Object.entries(value).forEach(driveInfo => {
                    [key, value] = driveInfo;
                    if (key === 'alternateLink') {
                      link = value;
                    }
                  })
                }
              })
              courseWorkMaterials[materialType] = link;
            })
          }
          courseWorkList.push({
            name: object.title,
            description: object.description,
            type: object.workType,
            materials: courseWorkMaterials,
            gclassLink: object.alternateLink
          })
        } else {
          console.log('Topic not found.')
        }
      })
      console.log(courseWorkList)
      console.log('\n')
    } else {
      console.log('No coursework found.');
    }
  });
}

read();
listCourseWorkByTopicId();