const authHeader = () => {
  const token = '' // insert token here
  return {'Authorization' : `Bearer ${token}`}
}

const leVersion = ''
const orgUnitId = ''
const forumId = ''
const topicId = ''

export const requestHeaders = {
  headers: authHeader()
}

let d2lRoute = `/d2l/api/le/${leVersion}/${orgUnitId}/discussions/forums/${forumId}/topics/${topicId}/posts/`

export const postNewQuestion = async (requestBody) => {
    const requestData = {
        "ParentPostId": null,
        "Subject": requestBody.Subject, 
        "Message": {
            "Content": requestBody.Content,
            "Type": "Text"
        },
        "IsAnonymous": false
    }

    const res = await axios.post( "https://d2llabs.desire2learn.com"+ d2lRoute, requestData, requestHeaders)
    return res.data
}