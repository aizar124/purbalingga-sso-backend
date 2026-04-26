import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';

const emptyStringToUndefined = ({ value }) => {
  if (typeof value !== 'string') {
    return value;
  }

  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export class UpdateProfileDto {
  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string;

  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @Matches(/^[a-zA-Z0-9._-]{3,30}$/, {
    message: 'Username hanya boleh 3-30 karakter berupa huruf, angka, titik, underscore, atau strip',
  })
  username?: string;

  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsDateString({}, { message: 'Format tanggal lahir tidak valid' })
  birthDate?: string;

  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  city?: string;

  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  bio?: string;

  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  @IsIn(['male', 'female', 'other'], { message: 'Jenis kelamin tidak valid' })
  gender?: string;

  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  picture?: string;

  @Transform(emptyStringToUndefined)
  @IsOptional()
  @IsString()
  avatarUrl?: string;
}
