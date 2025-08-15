import {
  Controller,
  Post,
  Body,
  Param,
  Patch,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Req,
  UseGuards,
  UnauthorizedException,
  Query, // Import Query for DTO binding
} from '@nestjs/common';
import { ReposService } from './repos.service';
import { CreateRepoDto } from './dto/create-repo.dto';
import { CommitRepoDto } from './dto/commit-repo.dto';
import { RepoResponseDto } from './dto/repo-response.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { User } from '../auth/interfaces/github-profile.interface'; // Import User interface
import { UserService } from '../user/user.service'; // To get GitHub Access Token
import { Response, Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiQuery, // Import ApiQuery for Swagger
} from '@nestjs/swagger';

// Import new DTOs
import { GetRepoContentsDto } from './dto/get-repo-contents.dto';
import { RepoContentDto } from './dto/repo-content.dto';


@ApiTags('Repositories (Authenticated User)') // Groups endpoints in Swagger UI
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('repos')
export class ReposController {
  constructor(
    private readonly reposService: ReposService,
    private readonly usersService: UserService, // Inject UsersService
  ) {}

  private async getGithubAccessToken(@Req() req: Request): Promise<string> {
    const user = req['user']; // req.user is populated by JwtAuthGuard
    console.log(user, 'user getGithubAccessToken');
    const fullUser = await this.usersService.findByEmail(user?.email);

    if (!fullUser || !fullUser.Account) {
      throw new UnauthorizedException('GitHub access token not found for user.');
    }

    const githubAccount = fullUser.Account.find(
      (account) => account.provider === 'github',
    );

    if (!githubAccount || !githubAccount.access_token) {
      throw new UnauthorizedException('GitHub access token not found for user.');
    }

    return githubAccount.access_token;
  }

  // Helper to get GitHub username from authenticated user
  private async getGithubUsername(@Req() req: Request): Promise<string> {
    const user = req['user'] as User;
    if (!user || !user.email) {
      throw new UnauthorizedException('User information not found.');
    }
    const fullUser = await this.usersService.findByEmail(user.email);
    if (!fullUser || !fullUser.username) {
      throw new UnauthorizedException('GitHub username not found for user.');
    }
    return fullUser.username;
  }


  @Post()
  @ApiOperation({ summary: 'Create a new GitHub repository for the authenticated user' })
  @ApiBody({ type: CreateRepoDto, description: 'Details for the new repository' })
  @ApiResponse({
    status: 201,
    description: 'The repository has been successfully created on GitHub.',
    type: RepoResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing JWT / GitHub PAT.' })
  @ApiResponse({ status: 403, description: 'Forbidden: PAT lacks required scopes.' })
  @ApiResponse({ status: 409, description: 'Conflict: Repository with this name already exists.' })
  @ApiResponse({ status: 500, description: 'Internal server error from GitHub API or application.' })
  async create(@Req() req: Request, @Body() createRepoDto: CreateRepoDto): Promise<RepoResponseDto> {
    const accessToken = await this.getGithubAccessToken(req);
    return await this.reposService.create(createRepoDto, accessToken);
  }

  @Patch(':repoName/commit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Simulate a commit to a GitHub repository by adding/updating a dummy file' })
  @ApiParam({
    name: 'repoName',
    description: 'The name of the repository (must belong to the authenticated user)',
    type: 'string',
    example: 'oauth-repo-test',
  })
  @ApiBody({ type: CommitRepoDto, description: 'The commit message' })
  @ApiResponse({
    status: 200,
    description: 'The commit (file update) was successful.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Commit (file update) successful.' },
        commitSha: { type: 'string', example: 'a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0' },
        htmlUrl: { type: 'string', example: 'https://github.com/octocat/my-repo/blob/main/commit-logs/log-1678886400000.md' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Repository not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing JWT / GitHub PAT.' })
  @ApiResponse({ status: 403, description: 'Forbidden: PAT lacks required scopes or repo is not writable.' })
  @ApiResponse({ status: 500, description: 'Internal server error from GitHub API or application.' })
  async commit(
    @Req() req: Request,
    @Param('repoName') repoName: string,
    @Body() commitRepoDto: CommitRepoDto,
  ): Promise<{ message: string; commitSha: string; htmlUrl: string }> {
    const accessToken = await this.getGithubAccessToken(req);
    const githubUsername = await this.getGithubUsername(req);

    console.log(accessToken, 'commit controller');
    console.log(commitRepoDto, githubUsername);
    return await this.reposService.commit(githubUsername, repoName, commitRepoDto, accessToken);
  }

  @Delete(':repoName')
  @HttpCode(HttpStatus.OK) // Changed to OK as you return a message body
  @ApiOperation({ summary: 'Delete a GitHub repository for the authenticated user' })
  @ApiParam({
    name: 'repoName',
    description: 'The name of the repository to delete (must belong to the authenticated user)',
    type: 'string',
    example: 'oauth-repo-test',
  })
  @ApiResponse({
    status: 200, // Changed to 200 to match the message return
    description: 'The repository has been successfully deleted from GitHub.',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Repository "oauth-repo-test" successfully deleted.' }
      }
    }
  })
  @ApiResponse({ status: 404, description: 'Repository not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing JWT / GitHub PAT.' })
  @ApiResponse({ status: 403, description: 'Forbidden: PAT lacks required scopes or not enough permissions to delete.' })
  @ApiResponse({ status: 500, description: 'Internal server error from GitHub API or application.' })
  async remove(@Req() req: Request, @Param('repoName') repoName: string): Promise<{ message: string }> {
    const accessToken = await this.getGithubAccessToken(req);
    const githubUsername = await this.getGithubUsername(req);

    await this.reposService.delete(githubUsername, repoName, accessToken);
    return { message: `Repository "${repoName}" successfully deleted.` };
  }

  @Get()
  @ApiOperation({ summary: 'Get all repositories for the authenticated user from GitHub' })
  @ApiResponse({
    status: 200,
    description: 'A list of all repositories from GitHub.',
    type: [RepoResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing JWT / GitHub PAT.' })
  @ApiResponse({ status: 500, description: 'Internal server error from GitHub API or application.' })
  async findAll(@Req() req: Request): Promise<RepoResponseDto[]> {
    const accessToken = await this.getGithubAccessToken(req);
    return await this.reposService.findAll(accessToken);
  }

  @Get(':repoName')
  @ApiOperation({ summary: 'Get a single repository by name for the authenticated user from GitHub' })
  @ApiParam({
    name: 'repoName',
    description: 'The name of the repository (must belong to the authenticated user)',
    type: 'string',
    example: 'github-oauth-manager',
  })
  @ApiResponse({
    status: 200,
    description: 'The found repository from GitHub.',
    type: RepoResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Repository not found.' })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing JWT / GitHub PAT.' })
  @ApiResponse({ status: 500, description: 'Internal server error from GitHub API or application.' })
  async findOne(@Req() req: Request, @Param('repoName') repoName: string): Promise<RepoResponseDto> {
    const accessToken = await this.getGithubAccessToken(req);
    const githubUsername = await this.getGithubUsername(req);

    return await this.reposService.findOne(githubUsername, repoName, accessToken);
  }

  // --- NEW ENDPOINT FOR REPO CONTENTS ---
  @Get(':repoName/contents')
  @ApiOperation({ summary: 'Get repository files and directory contents for the authenticated user' })
  @ApiParam({
    name: 'repoName',
    description: 'The name of the repository (must belong to the authenticated user)',
    type: 'string',
    example: 'your-repository-name',
  })
  @ApiQuery({ name: 'path', required: false, type: String, description: 'The content path within the repository. E.g., `src/main.ts` or `docs`. If omitted, the root directory contents are returned.' })
  @ApiQuery({ name: 'ref', required: false, type: String, description: 'The name of the commit, branch, or tag. Default: the repository’s default branch (usually `main` or `master`).' })
  @ApiResponse({ status: 200, description: 'List of repository contents (files/directories)', type: [RepoContentDto] })
  @ApiResponse({ status: 401, description: 'Unauthorized: Invalid or missing JWT / GitHub PAT.' })
  @ApiResponse({ status: 403, description: 'Forbidden: PAT lacks required scopes or repo is private.' })
  @ApiResponse({ status: 404, description: 'Not Found: Repository or specific path not found.' })
  @ApiResponse({ status: 500, description: 'Internal server error from GitHub API or application.' })
  async getRepoContents(
    @Req() req: Request,
    @Param('repoName') repoName: string,
    @Query() query: GetRepoContentsDto, // DTO for path and ref query parameters
  ): Promise<RepoContentDto[]> {
    const accessToken = await this.getGithubAccessToken(req);
    const githubUsername = await this.getGithubUsername(req);

    return await this.reposService.getRepoContents(
      githubUsername,
      repoName,
      accessToken,
      query,
    );
  }
}

