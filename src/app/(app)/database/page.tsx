
'use client';

import React, { useState } from 'react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Terminal } from 'lucide-react';
import backendData from '@/../docs/backend.json';

// Function to get top-level collections from backend.json
const getTopLevelCollections = () => {
    const paths = backendData.firestore.structure.map(s => s.path);
    const topLevel = new Set(paths.map(p => p.split('/')[1].replace(/{.*}/, '')));
    return Array.from(topLevel);
};

function DocumentJson({ data }: { data: any }) {
    // Clone and format data for display
    const formattedData = Object.entries(data).reduce((acc, [key, value]) => {
        if (value && typeof value === 'object' && value.seconds) {
            // Convert Firestore Timestamp to a readable date string
            acc[key] = new Date(value.seconds * 1000).toLocaleString();
        } else {
            acc[key] = value;
        }
        return acc;
    }, {} as any);

    return (
        <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
            <code className="text-white">{JSON.stringify(formattedData, null, 2)}</code>
        </pre>
    );
}

export default function DatabaseExplorerPage() {
    const [selectedCollection, setSelectedCollection] = useState<string>('');
    const firestore = useFirestore();

    const collectionQuery = useMemoFirebase(() => {
        if (!firestore || !selectedCollection) return null;
        return collection(firestore, selectedCollection);
    }, [firestore, selectedCollection]);

    const { data: documents, isLoading, error } = useCollection<any>(collectionQuery);
    const topLevelCollections = getTopLevelCollections();

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold font-headline">Database Explorer</h1>
                <p className="text-muted-foreground">
                    Inspect your Firestore data directly from the app.
                </p>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Select a Collection</CardTitle>
                    <CardDescription>Choose a collection to view its documents.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Select onValueChange={setSelectedCollection} value={selectedCollection}>
                        <SelectTrigger className="w-[280px]">
                            <SelectValue placeholder="Select collection" />
                        </SelectTrigger>
                        <SelectContent>
                            {topLevelCollections.map(name => (
                                <SelectItem key={name} value={name}>{name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </CardContent>
            </Card>

            {selectedCollection && (
                <Card>
                    <CardHeader>
                        <CardTitle>Documents in &apos;{selectedCollection}&apos;</CardTitle>
                        <CardDescription>
                            Showing the first 50 documents. Document IDs are displayed.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {isLoading && <p>Loading documents...</p>}
                        {error && (
                             <Alert variant="destructive">
                                <Terminal className="h-4 w-4" />
                                <AlertTitle>An Error Occurred</AlertTitle>
                                <AlertDescription>
                                    There was an error fetching the documents. Check your Firestore security rules.
                                    <pre className="mt-2 w-full rounded-md bg-slate-950 p-4">
                                        <code className="text-white">{error.message}</code>
                                    </pre>
                                </AlertDescription>
                            </Alert>
                        )}
                        {!isLoading && documents && (
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Document ID</TableHead>
                                        <TableHead>Data</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {documents.map(doc => (
                                        <TableRow key={doc.id}>
                                            <TableCell className="font-medium align-top">{doc.id}</TableCell>
                                            <TableCell>
                                                <ScrollArea className="h-[200px] w-full">
                                                    <DocumentJson data={doc} />
                                                </ScrollArea>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                         {!isLoading && (!documents || documents.length === 0) && (
                            <p className="text-center text-muted-foreground py-8">No documents in this collection.</p>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
