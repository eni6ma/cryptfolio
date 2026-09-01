import { HasPermission } from '@cryptfolio/api/decorators/has-permission.decorator';
import { HasPermissionGuard } from '@cryptfolio/api/guards/has-permission.guard';
import { AssetProfileInvalidError } from '@cryptfolio/api/services/data-provider/errors/asset-profile-invalid.error';
import { parseDate } from '@cryptfolio/common/helper';
import {
  DataProviderCryptfolioAssetProfileResponse,
  DataProviderCryptfolioStatusResponse,
  DividendsResponse,
  HistoricalResponse,
  LookupResponse,
  QuotesResponse
} from '@cryptfolio/common/interfaces';
import { permissions } from '@cryptfolio/common/permissions';
import { RequestWithUser } from '@cryptfolio/common/types';

import {
  Controller,
  Get,
  HttpException,
  Inject,
  Param,
  Query,
  UseGuards,
  Version
} from '@nestjs/common';
import { REQUEST } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { isISIN } from 'class-validator';
import { getReasonPhrase, StatusCodes } from 'http-status-codes';

import { GetDividendsDto } from './get-dividends.dto';
import { GetHistoricalDto } from './get-historical.dto';
import { GetQuotesDto } from './get-quotes.dto';
import { CryptfolioService } from './cryptfolio.service';

@Controller('data-providers/cryptfolio')
export class CryptfolioController {
  public constructor(
    private readonly cryptfolioService: CryptfolioService,
    @Inject(REQUEST) private readonly request: RequestWithUser
  ) {}

  @Get('asset-profile/:symbol')
  @HasPermission(permissions.enableDataProviderCryptfolio)
  @UseGuards(AuthGuard('api-key'), HasPermissionGuard)
  public async getAssetProfile(
    @Param('symbol') symbol: string
  ): Promise<DataProviderCryptfolioAssetProfileResponse> {
    const maxDailyRequests = await this.cryptfolioService.getMaxDailyRequests();

    if (
      this.request.user.dataProviderCryptfolioDailyRequests > maxDailyRequests
    ) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
        StatusCodes.TOO_MANY_REQUESTS
      );
    }

    try {
      const assetProfile = await this.cryptfolioService.getAssetProfile({
        symbol
      });

      await this.cryptfolioService.incrementDailyRequests({
        userId: this.request.user.id
      });

      return assetProfile;
    } catch (error) {
      if (error instanceof AssetProfileInvalidError) {
        throw new HttpException(
          getReasonPhrase(StatusCodes.NOT_FOUND),
          StatusCodes.NOT_FOUND
        );
      }

      throw new HttpException(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dividends/:symbol')
  @HasPermission(permissions.enableDataProviderCryptfolio)
  @UseGuards(AuthGuard('api-key'), HasPermissionGuard)
  @Version('2')
  public async getDividends(
    @Param('symbol') symbol: string,
    @Query() query: GetDividendsDto
  ): Promise<DividendsResponse> {
    const maxDailyRequests = await this.cryptfolioService.getMaxDailyRequests();

    if (
      this.request.user.dataProviderCryptfolioDailyRequests > maxDailyRequests
    ) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
        StatusCodes.TOO_MANY_REQUESTS
      );
    }

    try {
      const dividends = await this.cryptfolioService.getDividends({
        symbol,
        from: parseDate(query.from),
        granularity: query.granularity,
        to: parseDate(query.to)
      });

      await this.cryptfolioService.incrementDailyRequests({
        userId: this.request.user.id
      });

      return dividends;
    } catch {
      throw new HttpException(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('historical/:symbol')
  @HasPermission(permissions.enableDataProviderCryptfolio)
  @UseGuards(AuthGuard('api-key'), HasPermissionGuard)
  @Version('2')
  public async getHistorical(
    @Param('symbol') symbol: string,
    @Query() query: GetHistoricalDto
  ): Promise<HistoricalResponse> {
    const maxDailyRequests = await this.cryptfolioService.getMaxDailyRequests();

    if (
      this.request.user.dataProviderCryptfolioDailyRequests > maxDailyRequests
    ) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
        StatusCodes.TOO_MANY_REQUESTS
      );
    }

    try {
      const historicalData = await this.cryptfolioService.getHistorical({
        symbol,
        from: parseDate(query.from),
        granularity: query.granularity,
        to: parseDate(query.to)
      });

      await this.cryptfolioService.incrementDailyRequests({
        userId: this.request.user.id
      });

      return historicalData;
    } catch {
      throw new HttpException(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('lookup')
  @HasPermission(permissions.enableDataProviderCryptfolio)
  @UseGuards(AuthGuard('api-key'), HasPermissionGuard)
  @Version('2')
  public async lookupSymbol(
    @Query('includeIndices') includeIndicesParam = 'false',
    @Query('query') query = ''
  ): Promise<LookupResponse> {
    const includeIndices = includeIndicesParam === 'true';
    const maxDailyRequests = await this.cryptfolioService.getMaxDailyRequests();

    if (
      this.request.user.dataProviderCryptfolioDailyRequests > maxDailyRequests
    ) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
        StatusCodes.TOO_MANY_REQUESTS
      );
    }

    try {
      const result = await this.cryptfolioService.lookup({
        includeIndices,
        query: isISIN(query.toUpperCase())
          ? query.toUpperCase()
          : query.toLowerCase()
      });

      await this.cryptfolioService.incrementDailyRequests({
        userId: this.request.user.id
      });

      return result;
    } catch {
      throw new HttpException(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('quotes')
  @HasPermission(permissions.enableDataProviderCryptfolio)
  @UseGuards(AuthGuard('api-key'), HasPermissionGuard)
  @Version('2')
  public async getQuotes(
    @Query() query: GetQuotesDto
  ): Promise<QuotesResponse> {
    const maxDailyRequests = await this.cryptfolioService.getMaxDailyRequests();

    if (
      this.request.user.dataProviderCryptfolioDailyRequests > maxDailyRequests
    ) {
      throw new HttpException(
        getReasonPhrase(StatusCodes.TOO_MANY_REQUESTS),
        StatusCodes.TOO_MANY_REQUESTS
      );
    }

    try {
      const quotes = await this.cryptfolioService.getQuotes({
        symbols: query.symbols
      });

      await this.cryptfolioService.incrementDailyRequests({
        userId: this.request.user.id
      });

      return quotes;
    } catch {
      throw new HttpException(
        getReasonPhrase(StatusCodes.INTERNAL_SERVER_ERROR),
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('status')
  @HasPermission(permissions.enableDataProviderCryptfolio)
  @UseGuards(AuthGuard('api-key'), HasPermissionGuard)
  @Version('2')
  public async getStatus(): Promise<DataProviderCryptfolioStatusResponse> {
    return this.cryptfolioService.getStatus({ user: this.request.user });
  }
}
