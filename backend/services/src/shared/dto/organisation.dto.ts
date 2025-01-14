import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  ValidateIf,
  IsArray,
  ArrayMinSize,
} from "class-validator";
import { Role } from "../casl/role.enum";
import { CompanyRole } from "../enum/company.role.enum";
import { IsValidCountry } from "../util/validcountry.decorator";
import { SectoralScope } from "@undp/serial-number-gen";

export class OrganisationDto {
  companyId: number;

  @ValidateIf(
    (c) =>
      ![CompanyRole.GOVERNMENT, CompanyRole.API, CompanyRole.MINISTRY].includes(
        c.companyRole
      )
  )
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  taxId: string;

  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  name: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsEmail()
  @ApiProperty()
  email: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional()
  phoneNo: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsUrl()
  @IsOptional()
  @ApiPropertyOptional()
  website: string;

  @ValidateIf(
    (c) => ![CompanyRole.GOVERNMENT, CompanyRole.API].includes(c.companyRole)
  )
  @IsNotEmpty()
  @IsString()
  @ApiPropertyOptional()
  address: string;

  @IsString()
  @IsNotEmpty()
  @ApiPropertyOptional()
  @MaxLength(1048576, { message: "Logo cannot exceed 1MB" })
  logo: string;

  @IsValidCountry()
  @IsOptional()
  @ApiPropertyOptional()
  country: string;

  @IsNotEmpty()
  @ApiProperty({ enum: CompanyRole })
  @IsEnum(CompanyRole, {
    message:
      "Invalid role. Supported following roles:" + Object.values(CompanyRole),
  })
  companyRole: CompanyRole;

  @ValidateIf((c) => c.companyRole === CompanyRole.MINISTRY)
  @IsNotEmpty()
  @IsString()
  @ApiProperty()
  nameOfMinister: string;

  @ValidateIf((c) => c.companyRole === CompanyRole.MINISTRY)
  @IsArray()
  @ArrayMinSize(1)
  @MaxLength(100, { each: true })
  @IsNotEmpty({ each: true })
  @IsEnum(SectoralScope, {
    each: true,
    message:
      "Invalid sectoral scope. Supported following sectoral scope:" +
      Object.values(SectoralScope),
  })
  @ApiProperty({
    type: [String],
    enum: Object.values(SectoralScope),
  })
  sectoralScope: SectoralScope[];

  createdTime: number;
}
