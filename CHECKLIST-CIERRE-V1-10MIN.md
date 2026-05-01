# Checklist final de 10 minutos para cerrar v1

## Objetivo
Tomar una decisión rápida y seria de cierre de v1 sin volver a abrir el proyecto entero.

Si todo esto sale bien, la v1 puede considerarse cerrada de forma razonable.

---

## 1. Abrir el panel público
Entrar en:

- `https://panel.hacktrickstore.com`

### validar
- [ ] La app carga sin pantalla en blanco.
- [ ] No hay errores visibles de red o de render.
- [ ] La navegación lateral responde.

---

## 2. Dashboard

- [ ] Carga sin error.
- [ ] Se ven métricas principales.
- [ ] La cola de misiones muestra **Espacio**.
- [ ] OpenClaw aparece con estado válido.

---

## 3. Espacios

- [ ] La vista de Espacios carga.
- [ ] Se ve la matriz de roles.
- [ ] Se puede abrir el modal `+Miembro`.

---

## 4. Misiones

- [ ] La bandeja de Misiones carga.
- [ ] Se ven columnas **Origen** y **Espacio**.
- [ ] Se puede abrir `Nueva misión`.
- [ ] El selector de espacio aparece correctamente.

---

## 5. Flujos

- [ ] La biblioteca de Flujos carga.
- [ ] El selector de espacio objetivo aparece.
- [ ] Se puede lanzar un flujo sin romper la vista.

---

## 6. Tareas

- [ ] La bandeja de Tareas carga.
- [ ] Se ve la columna **Espacio**.
- [ ] Se puede entrar al detalle de una tarea.

---

## 7. Ejecuciones

- [ ] La bandeja de Ejecuciones carga.
- [ ] Se ve la columna **Espacio**.
- [ ] El panel lateral muestra **Espacio**.

---

## 8. Aprobaciones

- [ ] La bandeja de Aprobaciones carga.
- [ ] Se ve la columna **Espacio**.
- [ ] El panel lateral muestra **Espacio**.

---

## 9. Auditoría

- [ ] La bandeja de Auditoría carga.
- [ ] Se ven columnas **Espacio** y **Rol**.
- [ ] `/api/audit` responde correctamente en producción.

---

## 10. Criterio de salida

### puedes declarar v1 cerrada si:
- [ ] ninguna vista principal rompe
- [ ] la navegación principal funciona
- [ ] Dashboard, Misiones, Flujos, Espacios, Tareas, Ejecuciones, Aprobaciones y Auditoría cargan
- [ ] el contexto de espacio ya es visible donde importa
- [ ] no aparecen errores nuevos bloqueantes

---

## Si algo falla
No abras diez frentes a la vez.

Haz esto:
1. anota la pantalla exacta
2. anota la acción exacta
3. captura el error visible o el endpoint que falla
4. corrige solo ese hallazgo

---

## Decisión final

### Si todo sale bien
**Declarar v1 cerrada.**

### Si fallan uno o dos puntos menores
Corregirlos y repetir este mismo checklist corto.
