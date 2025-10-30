-- 001_init.sql - esquema mínimo recomendado para la app

create extension if not exists "uuid-ossp";

-- Usuarios (perfiles)
create table if not exists usuarios (
  id uuid primary key default uuid_generate_v4(),
  nombre text,
  email text unique,
  telefono text,
  rol text not null default 'paciente',
  fecha_creacion timestamptz default now()
);

-- Pacientes
create table if not exists pacientes (
  id uuid primary key default uuid_generate_v4(),
  nombre text,
  documento text,
  telefono text,
  fecha_nacimiento date,
  direccion text,
  usuario_id uuid references usuarios(id) on delete set null
);

-- Especialistas
create table if not exists especialistas (
  id uuid primary key default uuid_generate_v4(),
  usuario_id uuid references usuarios(id) on delete cascade,
  especialidad text,
  constraint unique_usuario_especialista unique(usuario_id)
);

-- Citas
create table if not exists citas (
  id uuid primary key default uuid_generate_v4(),
  paciente_id uuid references pacientes(id) on delete set null,
  especialista_id uuid references especialistas(id) on delete set null,
  fecha date,
  hora time,
  motivo text,
  estado text default 'agendada',
  created_at timestamptz default now()
);

-- Remisiones
create table if not exists remisiones (
  id uuid primary key default uuid_generate_v4(),
  paciente_id uuid references pacientes(id) on delete set null,
  especialista_id uuid references especialistas(id) on delete set null,
  fecha date,
  especialidad text,
  motivo text,
  estado text default 'pendiente',
  created_at timestamptz default now()
);

-- Exámenes (básico)
create table if not exists examenes (
  id uuid primary key default uuid_generate_v4(),
  paciente_id uuid references pacientes(id) on delete set null,
  fecha date,
  notas text,
  pdf_path text,
  created_at timestamptz default now()
);

-- Indexes útiles
create index if not exists idx_citas_fecha on citas(fecha);
create index if not exists idx_remisiones_fecha on remisiones(fecha);
