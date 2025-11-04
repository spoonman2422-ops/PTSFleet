
"use client";

import { useState } from "react";
import { useCollection, useFirestore } from "@/firebase";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, deleteDoc, doc, updateDoc } from "firebase/firestore";
import type { Vehicle } from "@/lib/types";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { VehicleTable } from "@/components/admin/vehicle-table";
import { VehicleDialog } from "@/components/admin/vehicle-dialog";
import { format } from "date-fns";
import { useUser } from "@/context/user-context";
import { logActivity } from "@/lib/activity-log-service";

export default function VehiclesPage() {
  const { data: vehicles, isLoading: isLoadingVehicles } = useCollection<Vehicle>("vehicles");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState<Vehicle | null>(null);
  const [deletingVehicle, setDeletingVehicle] = useState<Vehicle | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);

  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const handleAddNew = () => {
    setEditingVehicle(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (vehicle: Vehicle) => {
    setEditingVehicle(vehicle);
    setIsDialogOpen(true);
  };

  const handleOpenDeleteDialog = (vehicle: Vehicle) => {
    setDeletingVehicle(vehicle);
    setIsAlertOpen(true);
  };

  const handleDeleteVehicle = async () => {
    if (!deletingVehicle || !firestore || !user) return;
    try {
      await deleteDoc(doc(firestore, "vehicles", deletingVehicle.id));
      await logActivity({
        userId: user.id,
        userName: user.name,
        action: 'VEHICLE_DELETED',
        entityType: 'Vehicle',
        entityId: deletingVehicle.id,
        details: `Deleted vehicle: ${deletingVehicle.plateNumber}`,
      });
      toast({
        title: "Vehicle Deleted",
        description: `The vehicle with plate number ${deletingVehicle.plateNumber} has been removed.`,
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Error Deleting Vehicle",
        description: error.message || "An unexpected error occurred.",
      });
    } finally {
      setIsAlertOpen(false);
      setDeletingVehicle(null);
    }
  };

  const handleSaveVehicle = async (data: Omit<Vehicle, 'id'>, id?: string) => {
    if (!firestore || !user) return;
    
    const dataToSave = {
        ...data,
        dateAcquired: format(new Date(data.dateAcquired), "yyyy-MM-dd"),
        nextMaintenanceDate: format(new Date(data.nextMaintenanceDate), "yyyy-MM-dd"),
        amortizationEndDate: format(new Date(data.amortizationEndDate), "yyyy-MM-dd"),
    };

    if (id) {
      const docRef = doc(firestore, 'vehicles', id);
      await updateDoc(docRef, dataToSave);
      await logActivity({
        userId: user.id,
        userName: user.name,
        action: 'VEHICLE_UPDATED',
        entityType: 'Vehicle',
        entityId: id,
        details: `Updated vehicle: ${data.plateNumber}`,
      });
      toast({ title: "Vehicle Updated", description: "The vehicle details have been successfully updated." });
    } else {
      const docRef = await addDoc(collection(firestore, "vehicles"), dataToSave);
      await logActivity({
        userId: user.id,
        userName: user.name,
        action: 'VEHICLE_CREATED',
        entityType: 'Vehicle',
        entityId: docRef.id,
        details: `Added new vehicle: ${data.plateNumber}`,
      });
      toast({ title: "Vehicle Added", description: "The new vehicle has been added to the fleet." });
    }
    
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Vehicle Management</h1>
            <p className="text-muted-foreground">Track and manage all company vehicles.</p>
          </div>
          <Button onClick={handleAddNew}>
            <PlusCircle className="mr-2 h-4 w-4" />
            New Vehicle
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Fleet Overview</CardTitle>
            <CardDescription>View, filter, and manage all vehicles in the fleet.</CardDescription>
          </CardHeader>
          <CardContent>
            <VehicleTable
              data={vehicles || []}
              isLoading={isLoadingVehicles}
              onEdit={handleEdit}
              onDelete={handleOpenDeleteDialog}
            />
          </CardContent>
        </Card>
      </div>

      <VehicleDialog
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onSave={handleSaveVehicle}
        vehicle={editingVehicle}
      />

      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vehicle with plate number{' '}
              <span className="font-bold">{deletingVehicle?.plateNumber}</span>.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteVehicle} className="bg-destructive hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
