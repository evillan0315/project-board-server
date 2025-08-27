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
  Query,
} from '@nestjs/common';
import { ReposService } from './repos.service';
import { CreateRepoDto } from './dto/create-repo.dto';
import { CommitRepoDto } from './dto/commit-repo.dto';
import { RepoResponseDto } from './dto/repo-response.dto';
import { JwtAuthGuard } from '../auth/auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UserService } from '../user/user.service';
import { Request } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { GetRepoContentsDto } from './dto/get-repo-contents.dto';
import { RepoContentDto } from './dto/repo-content.dto';
import { CreateJwtUserDto } from '../auth/dto/auth.dto';

@ApiTags('Repositories (Authenticated User)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('repos')
export class ReposController {
  constructor(
    private readonly reposService: ReposService,
    private readonly usersService: UserService,
  ) {}

  /**
   * Helper: fetch authenticated user and their GitHub access token
   */
  private async getUserAndAccessToken(req: Request): Promise<{
    githubUsername: string;
    accessToken: string;
  }> {
    const user = req['user'] as CreateJwtUserDto;
    if (!user?.email) {
      throw new UnauthorizedException('User information not found.');
    }

    const fullUser = await this.usersService.findByEmail(user.email);

    if (!fullUser || !fullUser.Account) {
      throw new UnauthorizedException('GitHub account not linked.');
    }

    const githubAccount = fullUser.Account.find(
      (account) => account.provider === 'github',
    );

    if (!githubAccount?.access_token) {
      throw new UnauthorizedException('GitHub access token not found.');
    }

    if (!fullUser.username) {
      throw new UnauthorizedException('GitHub username not found.');
    }

    return {
      githubUsername: fullUser.username,
      accessToken: githubAccount.access_token,
    };
  }

  @Post()
  @ApiOperation({ summary: 'Create a new GitHub repository' })
  @ApiBody({ type: CreateRepoDto })
  @ApiResponse({
    status: 201,
    description: 'Repository successfully created.',
    type: RepoResponseDto,
  })
  async create(
    @Req() req: Request,
    @Body() createRepoDto: CreateRepoDto,
  ): Promise<RepoResponseDto> {
    const { accessToken } = await this.getUserAndAccessToken(req);
    return this.reposService.create(createRepoDto, accessToken);
  }

  @Patch(':repoName/commit')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Commit to a GitHub repository (dummy file)' })
  @ApiParam({ name: 'repoName', type: 'string', example: 'oauth-repo-test' })
  @ApiBody({ type: CommitRepoDto })
  async commit(
    @Req() req: Request,
    @Param('repoName') repoName: string,
    @Body() commitRepoDto: CommitRepoDto,
  ): Promise<{ message: string; commitSha: string; htmlUrl: string }> {
    const { accessToken, githubUsername } =
      await this.getUserAndAccessToken(req);
    return this.reposService.commit(
      githubUsername,
      repoName,
      commitRepoDto,
      accessToken,
    );
  }

  @Delete(':repoName')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a GitHub repository' })
  @ApiParam({ name: 'repoName', type: 'string', example: 'oauth-repo-test' })
  async remove(
    @Req() req: Request,
    @Param('repoName') repoName: string,
  ): Promise<{ message: string }> {
    const { accessToken, githubUsername } =
      await this.getUserAndAccessToken(req);
    await this.reposService.delete(githubUsername, repoName, accessToken);
    return { message: `Repository "${repoName}" successfully deleted.` };
  }

  @Get()
  @ApiOperation({ summary: 'Get all repositories for authenticated user' })
  @ApiResponse({ status: 200, type: [RepoResponseDto] })
  async findAll(@Req() req: Request): Promise<RepoResponseDto[]> {
    const { accessToken } = await this.getUserAndAccessToken(req);
    return this.reposService.findAll(accessToken);
  }

  @Get(':repoName')
  @ApiOperation({ summary: 'Get a repository by name' })
  @ApiParam({
    name: 'repoName',
    type: 'string',
    example: 'github-oauth-manager',
  })
  @ApiResponse({ status: 200, type: RepoResponseDto })
  async findOne(
    @Req() req: Request,
    @Param('repoName') repoName: string,
  ): Promise<RepoResponseDto> {
    const { accessToken, githubUsername } =
      await this.getUserAndAccessToken(req);
    return this.reposService.findOne(githubUsername, repoName, accessToken);
  }

  @Get(':repoName/contents')
  @ApiOperation({ summary: 'Get repository files & directory contents' })
  @ApiParam({ name: 'repoName', type: 'string', example: 'your-repo-name' })
  @ApiQuery({ name: 'path', required: false, type: String })
  @ApiQuery({ name: 'ref', required: false, type: String })
  @ApiResponse({ status: 200, type: [RepoContentDto] })
  async getRepoContents(
    @Req() req: Request,
    @Param('repoName') repoName: string,
    @Query() query: GetRepoContentsDto,
  ): Promise<RepoContentDto[]> {
    const { accessToken, githubUsername } =
      await this.getUserAndAccessToken(req);
    return this.reposService.getRepoContents(
      githubUsername,
      repoName,
      accessToken,
      query,
    );
  }
}
