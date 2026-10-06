-- ============================================================
-- MIS FINANZAS
-- BASE DE DATOS PRINCIPAL
-- SUPABASE / POSTGRESQL
-- ============================================================

-- ============================================================
-- EXTENSIONES
-- ============================================================

create extension if not exists pgcrypto;


-- ============================================================
-- PERFILES
-- Relacionado con auth.users de Supabase
-- ============================================================

create table if not exists public.profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    nombre text,
    moneda text not null default 'MXN',
    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);


-- ============================================================
-- CUENTAS / DINERO DISPONIBLE
-- ============================================================

create table if not exists public.cuentas (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    nombre text not null,

    tipo text not null
        check (
            tipo in (
                'efectivo',
                'debito',
                'ahorro',
                'otro'
            )
        ),

    saldo numeric(12,2) not null default 0,

    activa boolean not null default true,

    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);


-- ============================================================
-- INGRESOS
-- ============================================================

create table if not exists public.ingresos (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    cuenta_id uuid
        references public.cuentas(id)
        on delete set null,

    concepto text not null,

    importe numeric(12,2) not null
        check (importe > 0),

    fecha date not null,

    frecuencia text not null default 'unico'
        check (
            frecuencia in (
                'unico',
                'semanal',
                'quincenal',
                'mensual',
                'anual'
            )
        ),

    activo boolean not null default true,

    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);


-- ============================================================
-- CATEGORÍAS DE GASTOS
-- ============================================================

create table if not exists public.categorias_gastos (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid
        references auth.users(id)
        on delete cascade,

    nombre text not null,

    icono text,

    tipo text not null default 'variable'
        check (
            tipo in (
                'fijo',
                'variable',
                'extraordinario',
                'recurrente'
            )
        ),

    activo boolean not null default true,

    creado_en timestamptz not null default now()
);


-- ============================================================
-- GASTOS
-- IMPORTANTE:
-- Estos son gastos pagados directamente con dinero.
-- NO son pagos de tarjetas.
-- ============================================================

create table if not exists public.gastos (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    cuenta_id uuid
        references public.cuentas(id)
        on delete set null,

    categoria_id uuid
        references public.categorias_gastos(id)
        on delete set null,

    concepto text not null,

    importe numeric(12,2) not null
        check (importe > 0),

    fecha date not null,

    tipo text not null default 'variable'
        check (
            tipo in (
                'fijo',
                'variable',
                'extraordinario',
                'recurrente'
            )
        ),

    metodo_pago text not null default 'otro'
        check (
            metodo_pago in (
                'efectivo',
                'debito',
                'transferencia',
                'otro'
            )
        ),

    recurrente boolean not null default false,

    activo boolean not null default true,

    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);


-- ============================================================
-- TARJETAS DE CRÉDITO
-- ============================================================

create table if not exists public.tarjetas (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    nombre text not null,

    banco text,

    limite numeric(12,2) not null default 0,

    dia_corte integer not null
        check (dia_corte between 1 and 31),

    dia_pago integer
        check (dia_pago between 1 and 31),

    activa boolean not null default true,

    notas text,

    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);


-- ============================================================
-- COMPRAS CON TARJETA
-- ============================================================

create table if not exists public.compras_tarjeta (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    tarjeta_id uuid not null
        references public.tarjetas(id)
        on delete cascade,

    concepto text not null,

    monto_original numeric(12,2) not null
        check (monto_original > 0),

    tipo text not null default 'normal'
        check (
            tipo in (
                'normal',
                'meses'
            )
        ),

    meses_totales integer not null default 1
        check (meses_totales > 0),

    meses_pagados integer not null default 0
        check (meses_pagados >= 0),

    mensualidad numeric(12,2) not null
        check (mensualidad > 0),

    saldo_pendiente numeric(12,2) not null
        check (saldo_pendiente >= 0),

    fecha_compra date not null,

    fecha_primer_pago date,

    fecha_fin date,

    activa boolean not null default true,

    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);


-- ============================================================
-- PAGOS DE TARJETA
--
-- Esto representa dinero que realmente salió
-- de una cuenta para pagar la tarjeta.
-- ============================================================

create table if not exists public.pagos_tarjeta (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    tarjeta_id uuid not null
        references public.tarjetas(id)
        on delete cascade,

    cuenta_id uuid
        references public.cuentas(id)
        on delete set null,

    importe numeric(12,2) not null
        check (importe > 0),

    fecha date not null,

    concepto text,

    creado_en timestamptz not null default now()
);


-- ============================================================
-- CRÉDITOS
-- ============================================================

create table if not exists public.creditos (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    nombre text not null,

    institucion text,

    monto_original numeric(12,2) not null
        check (monto_original >= 0),

    saldo_pendiente numeric(12,2) not null
        check (saldo_pendiente >= 0),

    mensualidad numeric(12,2) not null
        check (mensualidad >= 0),

    meses_totales integer default 0,

    meses_pagados integer default 0,

    meses_restantes integer default 0,

    tasa_interes numeric(8,4),

    dia_pago integer
        check (dia_pago between 1 and 31),

    fecha_inicio date not null,

    fecha_fin date,

    activo boolean not null default true,

    notas text,

    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);


-- ============================================================
-- PAGOS DE CRÉDITOS
-- ============================================================

create table if not exists public.pagos_creditos (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    credito_id uuid not null
        references public.creditos(id)
        on delete cascade,

    cuenta_id uuid
        references public.cuentas(id)
        on delete set null,

    importe numeric(12,2) not null
        check (importe > 0),

    fecha date not null,

    tipo text not null default 'normal'
        check (
            tipo in (
                'normal',
                'abono',
                'liquidacion'
            )
        ),

    concepto text,

    creado_en timestamptz not null default now()
);


-- ============================================================
-- PRÉSTAMOS PERSONALES
-- ============================================================

create table if not exists public.prestamos_personales (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    persona text not null,

    monto_original numeric(12,2) not null
        check (monto_original > 0),

    saldo_pendiente numeric(12,2) not null
        check (saldo_pendiente >= 0),

    fecha_inicio date not null,

    fecha_obligatoria date,

    tipo_pago text not null default 'flexible'
        check (
            tipo_pago in (
                'flexible',
                'fecha'
            )
        ),

    notas text,

    activo boolean not null default true,

    creado_en timestamptz not null default now(),
    actualizado_en timestamptz not null default now()
);


-- ============================================================
-- ABONOS A PRÉSTAMOS
-- ============================================================

create table if not exists public.abonos_prestamos (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    prestamo_id uuid not null
        references public.prestamos_personales(id)
        on delete cascade,

    cuenta_id uuid
        references public.cuentas(id)
        on delete set null,

    importe numeric(12,2) not null
        check (importe > 0),

    fecha date not null,

    concepto text,

    creado_en timestamptz not null default now()
);


-- ============================================================
-- MOVIMIENTOS
--
-- Libro general de movimientos de dinero.
-- ============================================================

create table if not exists public.movimientos (
    id uuid primary key default gen_random_uuid(),

    usuario_id uuid not null
        references auth.users(id)
        on delete cascade,

    cuenta_id uuid
        references public.cuentas(id)
        on delete set null,

    tipo text not null,

    referencia_id uuid,

    concepto text not null,

    importe numeric(12,2) not null,

    fecha date not null,

    creado_en timestamptz not null default now()
);


-- ============================================================
-- ÍNDICES
-- ============================================================

create index if not exists idx_cuentas_usuario
on public.cuentas(usuario_id);

create index if not exists idx_ingresos_usuario
on public.ingresos(usuario_id);

create index if not exists idx_gastos_usuario
on public.gastos(usuario_id);

create index if not exists idx_tarjetas_usuario
on public.tarjetas(usuario_id);

create index if not exists idx_compras_tarjeta_usuario
on public.compras_tarjeta(usuario_id);

create index if not exists idx_compras_tarjeta_tarjeta
on public.compras_tarjeta(tarjeta_id);

create index if not exists idx_pagos_tarjeta_usuario
on public.pagos_tarjeta(usuario_id);

create index if not exists idx_creditos_usuario
on public.creditos(usuario_id);

create index if not exists idx_pagos_creditos_usuario
on public.pagos_creditos(usuario_id);

create index if not exists idx_prestamos_usuario
on public.prestamos_personales(usuario_id);

create index if not exists idx_abonos_prestamos_usuario
on public.abonos_prestamos(usuario_id);

create index if not exists idx_movimientos_usuario
on public.movimientos(usuario_id);


-- ============================================================
-- RLS
-- ============================================================

alter table public.profiles enable row level security;
alter table public.cuentas enable row level security;
alter table public.ingresos enable row level security;
alter table public.categorias_gastos enable row level security;
alter table public.gastos enable row level security;
alter table public.tarjetas enable row level security;
alter table public.compras_tarjeta enable row level security;
alter table public.pagos_tarjeta enable row level security;
alter table public.creditos enable row level security;
alter table public.pagos_creditos enable row level security;
alter table public.prestamos_personales enable row level security;
alter table public.abonos_prestamos enable row level security;
alter table public.movimientos enable row level security;


-- ============================================================
-- POLÍTICAS
-- ============================================================

create policy "profiles_select_own"
on public.profiles
for select
using (auth.uid() = id);

create policy "profiles_insert_own"
on public.profiles
for insert
with check (auth.uid() = id);

create policy "profiles_update_own"
on public.profiles
for update
using (auth.uid() = id);


create policy "cuentas_all_own"
on public.cuentas
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "ingresos_all_own"
on public.ingresos
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "categorias_gastos_all_own"
on public.categorias_gastos
for all
using (
    usuario_id is null
    or auth.uid() = usuario_id
)
with check (
    usuario_id is null
    or auth.uid() = usuario_id
);


create policy "gastos_all_own"
on public.gastos
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "tarjetas_all_own"
on public.tarjetas
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "compras_tarjeta_all_own"
on public.compras_tarjeta
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "pagos_tarjeta_all_own"
on public.pagos_tarjeta
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "creditos_all_own"
on public.creditos
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "pagos_creditos_all_own"
on public.pagos_creditos
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "prestamos_all_own"
on public.prestamos_personales
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "abonos_prestamos_all_own"
on public.abonos_prestamos
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


create policy "movimientos_all_own"
on public.movimientos
for all
using (auth.uid() = usuario_id)
with check (auth.uid() = usuario_id);


-- ============================================================
-- FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
-- ============================================================

create or replace function public.crear_perfil_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin

    insert into public.profiles (
        id,
        nombre
    )
    values (
        new.id,
        coalesce(
            new.raw_user_meta_data ->> 'nombre',
            ''
        )
    );

    return new;

end;
$$;


-- ============================================================
-- TRIGGER
-- ============================================================

drop trigger if exists trigger_crear_perfil
on auth.users;

create trigger trigger_crear_perfil
after insert on auth.users
for each row
execute function public.crear_perfil_usuario();


-- ============================================================
-- CATEGORÍAS PREDETERMINADAS
-- Se crearán para cada usuario posteriormente desde la aplicación.
-- ============================================================


-- ============================================================
-- FIN
-- ============================================================