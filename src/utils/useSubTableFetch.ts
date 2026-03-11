// src/hooks/useSubTableFetch.ts
import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../redux/hooks';
import type { ThunkAction, Action } from '@reduxjs/toolkit';
import type { RootState } from '../redux/store';

type AppThunk = ThunkAction<void, RootState, unknown, Action<string>>;

export function useSubTableFetch(
  subTableId: number | undefined,
  fetchAction: (id: number) => AppThunk 
) {
  const dispatch = useAppDispatch();
  const { id: sheetIdParam } = useParams();
  const sheetId = Number(sheetIdParam);
  const loadedFromSheetId = useAppSelector(
    (state) => state.subTable.loadedFromSheetId
  );

  useEffect(() => {
    if (!subTableId) return;
    if (loadedFromSheetId === sheetId) return;
    dispatch(fetchAction(subTableId));
  }, [subTableId, loadedFromSheetId, sheetId, dispatch, fetchAction]);
}