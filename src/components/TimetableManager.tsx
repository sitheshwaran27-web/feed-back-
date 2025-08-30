"use client";

import React, { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trash2, Edit, PlusCircle, Upload } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import ConfirmAlertDialog from './ConfirmAlertDialog';
import { useTimetable } from '@/hooks/useTimetable';
import { TimetableEntry } from '@/types/supabase';
import TimetableForm from './TimetableForm';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useBatches } from '@/hooks/useBatches';
import { supabase } from '@/integrations/supabase/client';
import { showError, showSuccess } from '@/utils/toast';
import * as XLSX from 'xlsx';

const daysOfWeek = [
  { value: 1, label: 'Monday' },
  { value: 2, label: 'Tuesday' },
  { value: 3, label: 'Wednesday' },
  { value: 4, label: 'Thursday' },
  { value: 5, label: 'Friday' },
  { value: 6, label: 'Saturday' },
  { value: 7, label: 'Sunday' },
];

const TimetableManager: React.FC = () => {
  const { timetableEntries, availableSubjects, loading, isSubmitting, addTimetableEntry, updateTimetableEntry, deleteTimetableEntry, fetchData } = useTimetable();
  const { batches, loading: batchesLoading } = useBatches();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<TimetableEntry | null>(null);
  const [formInitialData, setFormInitialData] = useState<Partial<Parameters<typeof TimetableForm>[0]['initialData']>>({});
  const [batchFilter, setBatchFilter] = useState('all');
  const [semesterFilter, setSemesterFilter] = useState('all');

  // Bulk upload state
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  type BulkRow = { day_of_week: number; subject_id: string; batch_id: string; semester_number: number | null; start_time: string; end_time: string };
  const [parsedRows, setParsedRows] = useState<BulkRow[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const normalizeTime = (t: string) => {
    const m = t.match(/^\s*(\d{1,2}):(\d{2})\s*$/);
    if (!m) return null;
    const hh = String(Math.min(23, Math.max(0, Number(m[1])))).padStart(2, '0');
    const mm = String(Math.min(59, Math.max(0, Number(m[2])))).padStart(2, '0');
    return `${hh}:${mm}`;
  };

  const dayNameToNumber = (s: string) => {
    const m = s.trim().toLowerCase();
    const map: Record<string, number> = { monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 7 };
    return map[m] ?? null;
  };

  const handleTemplateDownload = () => {
    const rows = [
      { day_of_week: 1, subject_name: 'Data Structures', batch: '2024-2028', semester_number: 3, start_time: '09:00', end_time: '10:00' },
      { day_of_week: 1, subject_name: 'Algorithms', batch: '2024-2028', semester_number: 3, start_time: '10:00', end_time: '11:00' },
    ];
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'timetable-template.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileChange: React.ChangeEventHandler<HTMLInputElement> = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const ws = wb.Sheets[wb.SheetNames[0]];
    const json: any[] = XLSX.utils.sheet_to_json(ws, { defval: '' });

    const errors: string[] = [];
    const valid: BulkRow[] = [];

    const subjectsById = new Set(availableSubjects.map(s => s.id));
    const subjectIdByName = new Map(availableSubjects.map(s => [s.name.toLowerCase(), s.id]));
    const batchByName = new Map(batches.map(b => [b.name.toLowerCase(), b.id]));
    const batchIds = new Set(batches.map(b => b.id));

    json.forEach((row, idx) => {
      const line = idx + 2; // header is row 1
      const rec: Record<string, string> = {};
      Object.keys(row).forEach(k => rec[k.toLowerCase().trim()] = String(row[k] ?? ''));

      // day_of_week or day
      let day_of_week: number | null = null;
      if (rec['day_of_week']) {
        const n = Number(rec['day_of_week']);
        day_of_week = isNaN(n) ? null : n;
      } else if (rec['day']) {
        day_of_week = dayNameToNumber(rec['day']);
      }
      if (!day_of_week || day_of_week < 1 || day_of_week > 7) { errors.push(`Row ${line}: invalid day_of_week/day.`); return; }

      // subject_id or subject_name
      let subject_id = '';
      if (rec['subject_id']) {
        if (!subjectsById.has(rec['subject_id'])) { errors.push(`Row ${line}: subject_id not found.`); return; }
        subject_id = rec['subject_id'];
      } else if (rec['subject_name']) {
        const id = subjectIdByName.get(rec['subject_name'].toLowerCase());
        if (!id) { errors.push(`Row ${line}: subject_name '${rec['subject_name']}' not found.`); return; }
        subject_id = id;
      } else { errors.push(`Row ${line}: subject_id or subject_name is required.`); return; }

      // batch_id or batch
      let batch_id = '';
      if (rec['batch_id']) {
        if (!batchIds.has(rec['batch_id'])) { errors.push(`Row ${line}: batch_id not found.`); return; }
        batch_id = rec['batch_id'];
      } else if (rec['batch']) {
        const id = batchByName.get(rec['batch'].toLowerCase());
        if (!id) { errors.push(`Row ${line}: batch '${rec['batch']}' not found.`); return; }
        batch_id = id;
      } else { errors.push(`Row ${line}: batch or batch_id is required.`); return; }

      const semRaw = rec['semester_number'] || rec['semester'] || '';
      const semester_number = semRaw === '' ? null : Number(semRaw);
      if (semester_number !== null && (isNaN(semester_number) || semester_number < 1 || semester_number > 12)) { errors.push(`Row ${line}: invalid semester_number.`); return; }

      const st = normalizeTime(rec['start_time'] || '');
      const et = normalizeTime(rec['end_time'] || '');
      if (!st || !et) { errors.push(`Row ${line}: start_time/end_time must be HH:MM.`); return; }
      if (st >= et) { errors.push(`Row ${line}: start_time must be before end_time.`); return; }

      valid.push({ day_of_week, subject_id, batch_id, semester_number, start_time: st, end_time: et });
    });

    setParseErrors(errors);
    setParsedRows(valid);
  };

  const handleBulkUpload = async () => {
    if (parsedRows.length === 0) { showError('No valid rows to upload.'); return; }
    setIsUploading(true);
    const payload = parsedRows.map(r => ({
      day_of_week: r.day_of_week,
      class_id: r.subject_id,
      batch_id: r.batch_id,
      semester_number: r.semester_number,
      start_time: r.start_time,
      end_time: r.end_time,
    }));
    const { error } = await supabase.from('timetables').insert(payload);
    if (error) {
      console.error('Bulk upload error:', error);
      showError('Bulk upload failed.');
    } else {
      showSuccess(`Uploaded ${payload.length} timetable entr${payload.length === 1 ? 'y' : 'ies'}.`);
      await fetchData();
      setIsBulkOpen(false);
      setParsedRows([]);
      setParseErrors([]);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    setIsUploading(false);
  };

  const filteredTimetableEntries = useMemo(() => {
    let filtered = timetableEntries;

    if (batchFilter !== 'all') {
      filtered = filtered.filter(entry => entry.batch_id === batchFilter);
    }

    if (semesterFilter !== 'all') {
      filtered = filtered.filter(entry => entry.semester_number === parseInt(semesterFilter));
    }
    return filtered;
  }, [timetableEntries, batchFilter, semesterFilter]);

  const groupedTimetable = useMemo(() => {
    const groups: { [key: number]: TimetableEntry[] } = {};
    daysOfWeek.forEach(day => (groups[day.value] = []));
    filteredTimetableEntries.forEach(entry => {
      if (entry.subjects) {
        groups[entry.day_of_week].push(entry);
      }
    });
    Object.values(groups).forEach(dayEntries => {
      dayEntries.sort((a, b) => {
        const timeA = a.start_time || '';
        const timeB = b.start_time || '';
        return timeA.localeCompare(timeB);
      });
    });
    return groups;
  }, [filteredTimetableEntries]);

  const handleAddTimetableEntry = async (values: any) => {
    const newEntry = await addTimetableEntry(values);
    if (newEntry) {
      closeForm();
    }
  };

  const handleUpdateTimetableEntry = async (values: any) => {
    if (!editingEntry) return;
    const updated = await updateTimetableEntry(editingEntry.id, values);
    if (updated) {
      closeForm();
    }
  };

  const handleDeleteTimetableEntry = async (id: string) => {
    await deleteTimetableEntry(id);
  };

  const openFormForAdd = (day: number) => {
    setEditingEntry(null);
    setFormInitialData({
      day_of_week: day,
      subject_id: "",
      batch_id: batchFilter !== 'all' ? batchFilter : "",
      semester_number: semesterFilter !== 'all' ? parseInt(semesterFilter) : undefined,
      start_time: "08:00",
      end_time: "09:00",
    });
    setIsFormOpen(true);
  };

  const openFormForEdit = (entry: TimetableEntry) => {
    setEditingEntry(entry);
    setFormInitialData({ 
      ...entry,
      subject_id: entry.subject_id,
      batch_id: entry.batch_id || "",
      semester_number: entry.semester_number || undefined,
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setEditingEntry(null);
    setFormInitialData({});
  };

  return (
    <Card className="w-full max-w-5xl mx-auto mt-8">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <CardTitle>Manage Weekly Timetable</CardTitle>
          <CardDescription>Add, edit, or remove subjects from the weekly schedule for specific batches and semesters.</CardDescription>
        </div>
        <Dialog open={isBulkOpen} onOpenChange={setIsBulkOpen}>
          <DialogTrigger asChild>
            <Button variant="outline"><Upload className="h-4 w-4 mr-2" /> Bulk Upload (.xlsx)</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[700px]">
            <DialogHeader>
              <DialogTitle>Bulk Upload Timetable (.xlsx)</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Accepted columns: day_of_week or day, subject_id or subject_name, batch or batch_id, semester_number (optional), start_time, end_time.</p>
              <div className="flex items-center gap-2 flex-wrap">
                <input ref={fileInputRef} type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleFileChange} />
                <Button type="button" variant="ghost" onClick={handleTemplateDownload}>Download template</Button>
              </div>
              {parseErrors.length > 0 && (
                <div className="rounded-md border border-destructive/50 p-3 text-sm text-destructive">
                  <p className="font-medium mb-1">Found {parseErrors.length} issue(s):</p>
                  <ul className="list-disc pl-5 space-y-1 max-h-40 overflow-auto">
                    {parseErrors.map((e, i) => (<li key={i}>{e}</li>))}
                  </ul>
                </div>
              )}
              {parsedRows.length > 0 && (
                <div className="rounded-md border p-3">
                  <p className="text-sm mb-2">Ready to upload: {parsedRows.length} entr{parsedRows.length === 1 ? 'y' : 'ies'}.</p>
                  <div className="max-h-48 overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr>
                          <th className="text-left p-2">Day</th>
                          <th className="text-left p-2">Subject</th>
                          <th className="text-left p-2">Batch</th>
                          <th className="text-left p-2">Semester</th>
                          <th className="text-left p-2">Time</th>
                        </tr>
                      </thead>
                      <tbody>
                        {parsedRows.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td className="p-2">{daysOfWeek.find(d => d.value === r.day_of_week)?.label || r.day_of_week}</td>
                            <td className="p-2">{availableSubjects.find(s => s.id === r.subject_id)?.name || r.subject_id}</td>
                            <td className="p-2">{batches.find(b => b.id === r.batch_id)?.name || r.batch_id}</td>
                            <td className="p-2">{r.semester_number ?? ''}</td>
                            <td className="p-2">{r.start_time} - {r.end_time}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {parsedRows.length > 10 && (
                    <p className="text-xs text-muted-foreground mt-2">Showing first 10 rows.</p>
                  )}
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsBulkOpen(false)} disabled={isUploading}>Cancel</Button>
                <Button onClick={handleBulkUpload} disabled={isUploading || parsedRows.length === 0}>{isUploading ? 'Uploading...' : `Upload ${parsedRows.length}`}</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          <Select value={batchFilter} onValueChange={setBatchFilter} disabled={batchesLoading}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Batch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Batches</SelectItem>
              {batches.map(batch => (
                <SelectItem key={batch.id} value={batch.id}>{batch.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={semesterFilter} onValueChange={setSemesterFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by Semester" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Semesters</SelectItem>
              {Array.from({ length: 8 }, (_, i) => i + 1).map(sem => (
                <SelectItem key={sem} value={sem.toString()}>{sem}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {loading ? (
          <Skeleton className="h-[400px] w-full" />
        ) : (
          <Tabs defaultValue="1" className="w-full">
            <TabsList className="grid w-full grid-cols-7">
              {daysOfWeek.map(day => (
                <TabsTrigger key={day.value} value={day.value.toString()}>{day.label}</TabsTrigger>
              ))}
            </TabsList>
            {daysOfWeek.map(day => (
              <TabsContent key={day.value} value={day.value.toString()}>
                <div className="mt-4 space-y-4">
                  {groupedTimetable[day.value].length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <p>No subjects scheduled for {day.label} in the selected filters.</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {groupedTimetable[day.value].map(entry => (
                        <div key={entry.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/50">
                          <div>
                            <p className="font-semibold">{entry.subjects.name} {entry.subjects.period ? `(P${entry.subjects.period})` : ''}</p>
                            <p className="text-sm text-muted-foreground">
                              {entry.start_time} - {entry.end_time}
                              {entry.batches?.name && ` (${entry.batches.name})`}
                              {entry.semester_number && ` Sem ${entry.semester_number}`}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="outline" size="sm" onClick={() => openFormForEdit(entry)}>
                              <Edit className="h-4 w-4 mr-2" /> Edit
                            </Button>
                            <ConfirmAlertDialog
                              title="Are you sure?"
                              description="This will permanently remove this subject from the timetable for this day."
                              onConfirm={() => handleDeleteTimetableEntry(entry.id)}
                            >
                              <Button variant="destructive" size="sm">
                                <Trash2 className="h-4 w-4 mr-2" /> Delete
                              </Button>
                            </ConfirmAlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <Button variant="outline" className="w-full" onClick={() => openFormForAdd(day.value)}>
                    <PlusCircle className="h-4 w-4 mr-2" /> Add Subject to {day.label}
                  </Button>
                </div>
              </TabsContent>
            ))}
          </Tabs>
        )}
      </CardContent>
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{editingEntry ? "Edit Timetable Entry" : "Add New Timetable Entry"}</DialogTitle>
          </DialogHeader>
          <TimetableForm
            initialData={formInitialData}
            availableSubjects={availableSubjects}
            onSubmit={editingEntry ? handleUpdateTimetableEntry : handleAddTimetableEntry}
            onCancel={closeForm}
            isSubmitting={isSubmitting}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default TimetableManager;
