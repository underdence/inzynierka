import { Transform } from 'class-transformer';
import { IsEmail, IsString, Length, MaxLength } from 'class-validator';

export class LoginDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'Podaj poprawny adres e-mail.' })
  @MaxLength(254, {
    message: 'Adres e-mail może mieć maksymalnie 254 znaki.',
  })
  email!: string;

  @IsString({ message: 'Hasło musi być tekstem.' })
  @Length(8, 128, {
    message: 'Hasło musi mieć od 8 do 128 znaków.',
  })
  password!: string;
}
