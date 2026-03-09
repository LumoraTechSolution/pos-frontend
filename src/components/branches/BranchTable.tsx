"use client";

import { Branch } from "@/services/branchService";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Edit2, BadgeInfo, MapPin, Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface BranchTableProps {
  data: Branch[];
  isLoading: boolean;
  onEdit: (branch: Branch) => void;
}

export default function BranchTable({ data, isLoading, onEdit }: BranchTableProps) {
  if (isLoading) {
    return (
      <div className="w-full h-64 bg-gray-900/20 rounded-xl border border-gray-800 animate-pulse flex items-center justify-center">
        <span className="text-gray-500">Loading branches...</span>
      </div>
    );
  }

  return (
    <div className="bg-gray-950 border border-gray-800 rounded-xl overflow-hidden">
      <Table>
        <TableHeader className="bg-gray-900/50">
          <TableRow className="border-gray-800">
            <TableHead className="text-gray-400">Branch Name</TableHead>
            <TableHead className="text-gray-400">Address</TableHead>
            <TableHead className="text-gray-400">Contact</TableHead>
            <TableHead className="text-gray-400">Status</TableHead>
            <TableHead className="text-gray-400">Type</TableHead>
            <TableHead className="text-right text-gray-400">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-gray-500">
                No branches found.
              </TableCell>
            </TableRow>
          ) : (
            data.map((branch) => (
              <TableRow key={branch.id} className="border-gray-800 hover:bg-gray-900/30 transition-colors">
                <TableCell className="font-medium">
                  <div className="flex flex-col">
                    <span className="text-gray-200">{branch.name}</span>
                    <span className="text-xs text-gray-500 font-mono">{branch.id.substring(0, 8)}...</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-gray-400">
                    <MapPin size={14} className="shrink-0" />
                    <span className="text-sm truncate max-w-[200px]">{branch.address || 'No address provided'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2 text-gray-400">
                    <Phone size={14} className="shrink-0" />
                    <span className="text-sm">{branch.phoneNumber || 'N/A'}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={branch.isActive ? "default" : "secondary"}
                    className={branch.isActive ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-gray-800 text-gray-400"}
                  >
                    {branch.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {branch.isDefault ? (
                    <Badge className="bg-primary/10 text-primary border-primary/20">
                      Primary
                    </Badge>
                  ) : (
                    <span className="text-gray-500 text-xs text-center block">Standard</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-gray-400 hover:text-white"
                    onClick={() => onEdit(branch)}
                  >
                    <Edit2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
