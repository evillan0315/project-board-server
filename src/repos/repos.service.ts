import {
  Injectable,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  UnauthorizedException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AxiosError, AxiosResponse, InternalAxiosRequestConfig, AxiosRequestHeaders } from 'axios';
import { catchError, firstValueFrom, of } from 'rxjs';
import { CreateRepoDto } from './dto/create-repo.dto';
import { CommitRepoDto } from './dto/commit-repo.dto';
import { RepoResponseDto } from './dto/repo-response.dto';
import { GetRepoContentsDto } from './dto/get-repo-contents.dto'; // Import new DTO
import { RepoContentDto } from './dto/repo-content.dto';       // Import new DTO

// Define a minimal interface for the GitHub file content response
interface GitHubFileContent {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content?: string;
  encoding?: string;
  _links: {
    git: string;
    self: string;
    html: string;
  };
}

// Define the response structure for the file commit/update operation
interface GitHubCommitResponse {
  content: {
    name: string;
    path: string;
    sha: string;
    html_url: string;
  };
  commit: {
    sha: string;
    node_id: string;
    url: string;
    html_url: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
    committer: {
      name: string;
      email: string;
      date: string;
    };
    message: string;
    tree: {
      sha: string;
      url: string;
    };
    parents: Array<{
      sha: string;
      url: string;
      html_url: string;
    }>;
    verification: {
      verified: boolean;
      reason: string;
      signature: string | null;
      payload: string | null;
    };
  };
}


@Injectable()
export class ReposService {
  private readonly GITHUB_API_URL = 'https://api.github.com';

  constructor(private readonly httpService: HttpService) {}

  // Helper to construct headers with a dynamic access token
  private getHeaders(accessToken: string) {
    return {
      Authorization: `token ${accessToken}`,
      Accept: 'application/vnd.github.v3+json',
      'X-GitHub-Api-Version': '2022-11-28',
    };
  }

  private handleError(error: AxiosError): never {
    if (error.response) {
      const status = error.response.status;
      const data: any = error.response.data;
      const message = data.message || 'An error occurred with GitHub API.';

      console.error(
        `GitHub API Error - Status: ${status}, Message: ${message}`,
        data.errors,
      );

      switch (status) {
        case 401:
          throw new UnauthorizedException(
            `GitHub Authentication Failed: ${message}`,
          );
        case 403:
          throw new ForbiddenException(`GitHub Forbidden: ${message}`);
        case 404:
          throw new NotFoundException(`GitHub Not Found: ${message}`);
        case 409:
          throw new ConflictException(`GitHub Conflict: ${message}`); // E.g., repo already exists
        case 422:
          throw new BadRequestException(
            `GitHub Unprocessable Entity (Validation Error): ${message}`,
          );
        default:
          throw new InternalServerErrorException(
            `GitHub API Error: ${message} (Status: ${status})`,
          );
      }
    } else if (error.request) {
      console.error('GitHub API No Response:', error.request);
      throw new InternalServerErrorException(
        'No response received from GitHub API.',
      );
    } else {
      console.error('GitHub API Request Setup Error:', error.message);
      throw new InternalServerErrorException(
        `Error setting up GitHub API request: ${error.message}`,
      );
    }
  }

  /**
   * Creates a new GitHub repository for the authenticated user.
   * @param createRepoDto The DTO containing repository details.
   * @param accessToken The user's GitHub access token.
   * @returns The created repository object.
   */
  async create(createRepoDto: CreateRepoDto, accessToken: string): Promise<RepoResponseDto> {
    const url = `${this.GITHUB_API_URL}/user/repos`;
    console.log(url, accessToken);
    console.log(createRepoDto, 'createRepoDto');
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .post<RepoResponseDto>(
            url,
            {
              name: createRepoDto.name,
              description: createRepoDto.description,
              private: createRepoDto.private,
            },
            { headers: this.getHeaders(accessToken) },
          )
          .pipe(catchError((error: AxiosError) => this.handleError(error))),
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Simulates a commit by creating/updating a dummy file.
   * @param githubUsername The username of the repository owner (must be the authenticated user).
   * @param repoName The name of the repository.
   * @param commitRepoDto The DTO containing the commit message.
   * @param accessToken The user's GitHub access token.
   * @returns A success message with commit details.
   */
  async commit(
    githubUsername: string,
    repoName: string,
    commitRepoDto: CommitRepoDto,
    accessToken: string,
  ): Promise<{ message: string; commitSha: string; htmlUrl: string }> {
    const filePath = `commit-logs/log-${Date.now()}.md`;
    const fileContent = Buffer.from(
      `Commit Message: ${commitRepoDto.message}\nDate: ${new Date().toISOString()}`,
    ).toString('base64');

    const getFileUrl = `${this.GITHUB_API_URL}/repos/${githubUsername}/${repoName}/contents/${filePath}`;
    const createUpdateFileUrl = `${this.GITHUB_API_URL}/repos/${githubUsername}/${repoName}/contents/${filePath}`;
    console.log(getFileUrl, fileContent);
    let sha: string | undefined;

    try {
      const { data: existingFile } = await firstValueFrom(
        this.httpService
          .get<GitHubFileContent>(getFileUrl, { headers: this.getHeaders(accessToken) })
          .pipe(
            catchError((error: AxiosError) => {
              if (error.response?.status === 404) {
                // Define a minimal valid InternalAxiosRequestConfig for the fallback.
                // InternalAxiosRequestConfig requires `headers`. Other properties like
                // `url` and `method` are optional.
                const fallbackConfig: InternalAxiosRequestConfig<any> = {
                    headers: {} as AxiosRequestHeaders, // Provide an empty object for headers to satisfy the type
                };

                const mockResponse: AxiosResponse<null> = {
                  data: null,
                  status: 404,
                  statusText: 'Not Found',
                  headers: {}, // This headers property is for the AxiosResponse, not the config
                  // Use error.config if available, otherwise use the minimal fallback
                  config: error.config || fallbackConfig,
                  request: error.request || {}, // request is optional anyway
                };
                return of(mockResponse); // Wrap the mock response in an Observable using 'of'
              }
              // For other errors, re-throw via handleError
              return this.handleError(error);
            }),
          ),
      );

      if (existingFile && existingFile.sha) {
        sha = existingFile.sha;
      }
    } catch (error) {
      throw error;
    }
    console.log(fileContent, createUpdateFileUrl);
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .put<GitHubCommitResponse>(
            createUpdateFileUrl,
            {
              message: commitRepoDto.message,
              content: fileContent,
              sha: sha,
              branch: 'main',
            },
            { headers: this.getHeaders(accessToken) },
          )
          .pipe(catchError((error: AxiosError) => this.handleError(error))),
      );
      console.log(data, 'data commit success');
      return {
        message: 'Commit (file update) successful.',
        commitSha: data.commit.sha,
        htmlUrl: data.content.html_url,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Deletes a GitHub repository for the authenticated user.
   * @param githubUsername The username of the repository owner (must be the authenticated user).
   * @param repoName The name of the repository to delete.
   * @param accessToken The user's GitHub access token.
   */
  async delete(githubUsername: string, repoName: string, accessToken: string): Promise<void> {
    const url = `${this.GITHUB_API_URL}/repos/${githubUsername}/${repoName}`;

    try {
      await firstValueFrom(
        this.httpService
          .delete(url, { headers: this.getHeaders(accessToken) })
          .pipe(catchError((error: AxiosError) => this.handleError(error))),
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves all repositories for the authenticated user.
   * @param accessToken The user's GitHub access token.
   * @returns An array of repository objects.
   */
  async findAll(accessToken: string): Promise<RepoResponseDto[]> {
    const url = `${this.GITHUB_API_URL}/user/repos`;

    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get<RepoResponseDto[]>(url, { headers: this.getHeaders(accessToken) })
          .pipe(catchError((error: AxiosError) => this.handleError(error))),
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves a single repository by name for the authenticated user.
   * @param githubUsername The username of the repository owner (must be the authenticated user).
   * @param repoName The name of the repository.
   * @param accessToken The user's GitHub access token.
   * @returns The repository object.
   */
  async findOne(githubUsername: string, repoName: string, accessToken: string): Promise<RepoResponseDto> {
    const url = `${this.GITHUB_API_URL}/repos/${githubUsername}/${repoName}`;
    console.log(url, 'url findOne');
    try {
      const { data } = await firstValueFrom(
        this.httpService
          .get<RepoResponseDto>(url, { headers: this.getHeaders(accessToken) })
          .pipe(catchError((error: AxiosError) => this.handleError(error))),
      );
      return data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Retrieves the contents (files and/or directories) of a GitHub repository.
   * @param githubUsername The owner of the repository.
   * @param repoName The name of the repository.
   * @param accessToken The user's GitHub access token.
   * @param query Optional DTO containing 'path' and 'ref'.
   * @returns An array of RepoContentDto, representing files, directories, etc.
   */
  async getRepoContents(
    githubUsername: string,
    repoName: string,
    accessToken: string,
    query?: GetRepoContentsDto,
  ): Promise<RepoContentDto[]> {
    // Base URL for contents API
    let url = `${this.GITHUB_API_URL}/repos/${githubUsername}/${repoName}/contents`;

    // Append path if provided. The GitHub API handles this correctly.
    if (query?.path) {
      url += `/${query.path}`;
    }

    // Construct query parameters for 'ref'
    const params = new URLSearchParams();
    if (query?.ref) {
      params.append('ref', query.ref);
    }

    // Add parameters to the URL if any exist
    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    try {
      // GitHub API can return a single object (if 'path' is a file) or an array (if 'path' is a directory).
      // We explicitly type the response to handle both.
      const { data } = await firstValueFrom(
        this.httpService
          .get<RepoContentDto | RepoContentDto[]>(url, { headers: this.getHeaders(accessToken) })
          .pipe(
            catchError((error: AxiosError) => {
              // This catchError specifically re-throws, letting handleError manage exceptions.
              // If it's a 404 for a specific path that doesn't exist, handleError will throw NotFoundException.
              return this.handleError(error);
            }),
          ),
      );

      // Ensure a consistent return type of array
      if (Array.isArray(data)) {
        return data;
      } else {
        // If it's a single file object, wrap it in an array for consistent consumption
        return [data];
      }
    } catch (error) {
      // handleError already threw specific exceptions, so just re-throw
      throw error;
    }
  }
}

