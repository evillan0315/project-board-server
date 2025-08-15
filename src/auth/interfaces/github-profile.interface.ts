 // Define a basic structure for the GitHub profile returned by passport-github
export interface GitHubProfile {
    id: string; // GitHub user ID (string)
    nodeId: string;
    displayName: string;
    username: string;
    profileUrl: string;
    photos: [{ value: string }]; // Array of photo URLs
    provider: string; // 'github'
    _raw: string; // Raw JSON response from GitHub
    _json: any; // Parsed JSON response from GitHub
}

// User object to be stored in memory and passed around
export interface User {
    id: string; // Internal user ID
    githubId: string; // GitHub user ID (numeric string)
    username: string;
    email: string;
    githubAccessToken: string; // The token we need for API calls
    displayName: string;
}
