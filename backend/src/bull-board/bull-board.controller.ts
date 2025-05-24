import { Controller, All, Req, Res, Next } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { BullBoardService } from './bull-board.service';

@Controller('admin/queues')
export class BullBoardController {
  constructor(private readonly bullBoardService: BullBoardService) {}

  @All('*')
  async bullBoard(
    @Req() req: Request,
    @Res() res: Response,
    @Next() next: NextFunction,
  ) {
    const router = this.bullBoardService.getRouter();
    
    // Remove the /admin/queues prefix from the path
    const originalUrl = req.url;
    const basePath = '/admin/queues';
    
    if (originalUrl.startsWith(basePath)) {
      req.url = originalUrl.substring(basePath.length) || '/';
    }
    
    router(req, res, next);
  }
} 